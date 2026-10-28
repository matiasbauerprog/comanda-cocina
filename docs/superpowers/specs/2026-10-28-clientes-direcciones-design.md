# Clientes con varias direcciones, buscador y unión de duplicados

Fecha: 2026-10-28

## Por qué

Hoy el cliente (el dueño de Gaspacho) carga a una misma persona dos veces cuando pide a dos lugares: "Mariana casa" y "Mariana trabajo". Eso trae dos problemas:

1. **Gestión incómoda.** La ventana "Agregar o quitar" de clientes (y la de platos, que es el mismo componente) no tiene buscador: hay que scrollear toda la lista.
2. **Estadísticas distorsionadas.** La segmentación nuevos/fieles agrupa por nombre, así que Mariana con 10 pedidos figura como dos clientas de 5.

La solución es que un cliente tenga varias direcciones, que las listas de gestión se puedan filtrar, y que el dueño pueda unir él mismo los duplicados que ya existen.

## Objetivos

- Buscador en la ventana de gestión de clientes y de platos.
- Un cliente = una persona, con una lista de direcciones etiquetadas.
- Elegir la dirección al tomar el pedido, y poder guardar una dirección nueva en el cliente desde ahí.
- Una página `/unir-clientes` que el dueño usa solo para unir los duplicados existentes.

## No objetivos

- No se crea tabla `pedido_items` ni `cliente_id` en pedidos (normalización pendiente de la auditoría; queda para otro momento).
- No se modifican las direcciones guardadas en pedidos viejos: cada pedido conserva la dirección a la que se mandó.
- No hay variantes de platos.

## Anti-objetivos (sería un fracaso aunque funcione)

- Perder pedidos o clientes en una unión a medias (ej. se borró el duplicado pero no se renombraron los pedidos).
- Que la cocina (rol `kitchen`) pueda tocar clientes o pedidos.
- Que tomar un pedido se vuelva más lento: el flujo actual (elegir cliente → dirección precargada → platos) tiene que seguir siendo igual de rápido.

## Diseño

### 1. Buscador en ManageModal

- Campo "Buscar…" arriba de la lista en `src/components/ManageModal.jsx`. Aplica a clientes y platos por igual.
- Filtra por "contiene", sin distinguir mayúsculas ni tildes (normalizar con `normalize('NFD')` y quitar diacríticos). Busca en el nombre y, para clientes, en las direcciones y sus etiquetas.
- La normalización va a una función pura en `src/lib/` (ej. `normalizeSearch`) con test, y la reutiliza también `CustomDropdown`, que hoy no ignora tildes.

### 2. Modelo de datos: direcciones dentro del cliente

- Nueva columna `clientes.direcciones jsonb not null default '[]'`, una lista de `{ "etiqueta": string, "direccion": string }`. La etiqueta puede ser vacía.
- Migración: por cada cliente con `direccion` no vacía, `direcciones = [{etiqueta:'', direccion}]`.
- La columna `direccion` vieja **no se borra** en esta entrega (red de seguridad). El código la sigue escribiendo con la primera dirección de la lista (o `''`), así si hubiera que volver a la versión anterior los datos siguen sirviendo. Se puede eliminar más adelante.
- Elegido (decisión de Claude): jsonb en la misma tabla y no tabla aparte, porque la app ya sincroniza `clientes` en vivo y las direcciones siempre se leen junto con el cliente.

### 3. Gestión de clientes

- ManageModal recibe la definición de campos; para clientes se necesita editar una lista. Al editar un cliente se muestra el nombre y debajo sus direcciones, cada una con etiqueta + dirección, botón para borrar y botón "+ Dirección".
- Al dar de alta un cliente se carga nombre y una primera dirección (opcional) con etiqueta opcional.
- En la vista normal de la lista, debajo del nombre se ven las direcciones (etiqueta en negrita si hay).
- Cómo se generaliza ManageModal (prop extra, render prop o componente separado para clientes) queda a criterio del implementador; platos debe seguir igual.

### 4. Nuevo pedido (OrderForm)

- Al elegir un cliente:
  - 0 direcciones: el campo de dirección queda vacío, como hoy.
  - 1 o más: aparecen como botones/chips (etiqueta, o la dirección si no tiene etiqueta) y la **primera** queda seleccionada y copiada al campo de dirección.
- El campo de dirección sigue editable a mano.
- Si el texto del campo no coincide con ninguna dirección del cliente (comparado normalizado y sin espacios de más) y no está vacío, aparece un botón "Guardar en el cliente" que agrega `{etiqueta:'', direccion}` a sus direcciones. No se pide etiqueta ahí para no frenar la toma del pedido; se puede poner después en la gestión.
- El dropdown de clientes muestra como detalle las direcciones unidas por " · ".
- El pedido se sigue guardando con `cliente_nombre` y `cliente_direccion` como texto, sin cambios.

### 5. Página `/unir-clientes`

**Acceso**
- Ruta `/unir-clientes`. No hay router: se detecta con `window.location.pathname` en `App.jsx`.
- Requiere rol `owner`. Sin sesión se muestra el login y, al ingresar, se queda en la misma URL. Con rol `kitchen` se muestra un mensaje de "solo Gaspi puede usar esta página".
- Botón para volver a la app (`/`).
- Vercel necesita un `vercel.json` con rewrite de todas las rutas a `/index.html`, si no el link directo da 404.

**Sugerencias**
- Se agrupan clientes por la primera palabra del nombre normalizada. Solo se muestran grupos de 2 o más.
- Por grupo:
  - Nombre final editable, propuesto = la primera palabra con la capitalización del primer cliente del grupo.
  - Lista de los clientes del grupo con checkbox (todos tildados). Destildar excluye a ese cliente.
  - Las direcciones resultantes, con etiqueta propuesta = el resto del nombre del cliente de origen ("Mariana casa" → "casa"), editable.
  - Botones "Unir" y "No son la misma persona".
- "No son la misma persona" oculta el grupo; se recuerda en `localStorage` (con try/catch) para que no vuelva a aparecer en ese navegador.

**Unión manual**
- Buscador + checkboxes sobre todos los clientes; al tildar 2 o más se arma un grupo con el mismo formulario.

**Qué hace "Unir"**
- Pide confirmación con el resumen ("Se unen 2 clientes en 'Mariana', N pedidos pasan a llamarse 'Mariana'. No se puede deshacer").
- Llama a una función de Postgres por `supabase.rpc('unir_clientes', …)` que, **en una sola transacción**:
  1. Actualiza el cliente que se conserva (el más antiguo del grupo) con el nombre final y la lista de direcciones (sin duplicados).
  2. Renombra `pedidos.cliente_nombre` de todos los nombres viejos del grupo (comparando con `lower(trim())`) al nombre final.
  3. Borra los demás clientes del grupo.
- La función es `security invoker`, así respeta RLS: solo el dueño puede ejecutarla con efecto.
- Si falla, no cambia nada y se muestra el error.

### 6. SQL

Un archivo nuevo `supabase/clientes-direcciones.sql` (el dueño de la app lo corre una vez en el SQL Editor) con:
- **Primero, respaldo:** `create table clientes_backup_20261028 as select * from clientes;` y lo mismo para `pedidos`. Supabase tiene datos reales del cliente; el script no borra nada y el respaldo permite recuperar cualquier unión hecha por error. Las tablas de respaldo quedan con RLS activado y sin políticas, así no son accesibles desde la app.
- `alter table` de la columna `direcciones` + migración de `direccion`.
- La función `unir_clientes`.

El código nuevo tiene que tolerar el estado en que la columna todavía no existe solo en la medida de no romper la app al cargar; el orden de despliegue es: correr el SQL → publicar.

## Restricciones

- Supabase con RLS: solo `owner` escribe en `clientes` y `pedidos`.
- Sin router ni librerías nuevas.
- Tests con `node --test` para la lógica pura: normalización, armado de grupos sugeridos, etiqueta propuesta, deduplicación de direcciones.
- Lint en 0 errores.

## Lo que queda al implementador

- Estructura de componentes de la página de unir y de la edición de direcciones.
- Estilos, siguiendo los del resto de la app.
- Mensajes exactos de la UI.
