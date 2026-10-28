# Reboot visual de Gaspacho + platos más pedidos

Fecha: 2026-10-28

## Por qué

El dueño de la app diseñó una versión más moderna de Gaspacho (`Gaspacho Reboot/Gaspacho Reboot.dc.html`, un prototipo navegable con datos de ejemplo). El diseño es **una inspiración**: marca la cara nueva de la app, pero la app conserva todo lo que hace hoy. Además se agrega un acceso rápido a los platos más pedidos al cargar un pedido, para tomar pedidos más rápido.

`Gaspacho Reboot/Gaspacho Actual.dc.html` es una recreación de la app actual hecha en la misma herramienta; sirve para comparar.

## Objetivos

- Toda la app (Gestor, Comanda, Estadísticas, cabecera, login, modales, `/unir-clientes`) adopta el lenguaje visual del reboot.
- El formulario de nuevo pedido toma la interacción del reboot: buscar cliente y plato escribiendo, Enter agrega, total grande, botón "Enviar a cocina".
- Botones de los 6 platos más pedidos de los últimos 30 días debajo del buscador de platos.
- Se suman tres detalles del diseño: indicador "En vivo", aviso al enviar o despachar un pedido ("Pedido de Ana enviado a cocina") y la cantidad de pedidos en curso en el botón Comanda.

## No objetivos

- No se pierde ninguna función actual (ver "Se conserva").
- No hay "lo que suele pedir este cliente" (el usuario eligió solo los más pedidos en general).
- No cambia la base de datos ni hay SQL nuevo.
- Las estadísticas no se reemplazan por los datos de ejemplo del diseño: se usan los datos reales que ya calcula `computeAnalyticsKPIs`.

## Anti-objetivos

- Que la app quede lenta al abrir (respeta la carga rápida: pendientes + hoy, historial a pedido).
- Que en el celular sea incómoda: hoy se usa en celular y tiene que seguir andando bien a ~375 px de ancho.
- Que la Comanda sea difícil de leer de lejos.

## Lenguaje visual (tomado del diseño)

- **Tipografías:** Bricolage Grotesque (títulos y números grandes), Geist (texto), Geist Mono (horas, montos, cantidades). Reemplazan Outfit, Inter y Playfair.
- **Colores:** fondo `#F4F2EC`, superficies `#FFFFFF`, bordes `#E6E2D8` / `#DDD8CC` / `#EFEBE3`, superficie suave `#FAF8F4`, segmentados `#EAE6DC`; texto `#0B1B2E`, secundario `#5C6470`, terciario `#7A7F88`, placeholder `#9A9EA6`; marca navy `#002855`, rojo `#E60000`, amarillo `#FFD700`; efectivo `#0E6B42` sobre `#E3F3EA`, tarjeta `#002855` sobre `#E8EEF6`; en vivo `#12A05C`.
- **Urgencia** (Gestor y Comanda): los valores de la tabla `URG` del diseño (none / calm / soon / urgent / late), con las mismas reglas de minutos que hoy (`getUrgency`).
- **Comanda:** fondo `#0C1522`, tarjetas `#142033`, borde `#22324A`, texto `#F4F2EC`, secundario `#8796AB`; cantidades en amarillo y observaciones sobre fondo amarillo.
- **Forma:** tarjetas con radio 16–18 px y borde fino, sin las sombras grandes ni el efecto glass de hoy; segmentados tipo "pastilla" para navegación, pago y filtros.
- **Íconos:** `lucide-react`, que ya usa la app (el diseño usa los mismos íconos de Lucide vía URL).
- Los colores van como tokens en `src/index.css` (`@theme` de Tailwind 4), no repetidos a mano en cada componente.

## Pantallas

### Cabecera (dueño)
- Logo + "Gaspacho." + bajada "Pedidos · cocina · ventas"; navegación segmentada Gestor / Comanda (con contador de pedidos en curso en rojo) / Estadísticas; "En vivo"; cambiar contraseña y Salir.
- Los dos KPIs del Gestor que hoy están arriba del historial (**Total vendido** y **Pedidos despachados**) pasan a la cabecera como en el diseño, **conservando** su filtro (hoy/semana/mes/calendario) y su modal de detalle al tocarlos.
- En celular: la navegación y los KPIs pasan a una segunda fila o al menú, a criterio del implementador, sin scroll horizontal.

### Gestor — Nuevo pedido
- **Cliente:** buscador inline "Buscar por nombre o dirección" con resultados (iniciales en círculo, nombre, direcciones). Al elegir: ficha con nombre, botón "Cambiar", direcciones como botones (las de la entrega anterior: `getDirecciones`), campo de dirección editable y "Guardar en el cliente" como hoy. "Gestionar clientes" abre la gestión actual (ManageModal con buscador y direcciones).
- **Platos:** buscador inline "Buscar entre N platos"; resultados con precio, cantidad si ya está en el pedido y "+"; **Enter agrega el primero**, Escape limpia; tocar un plato que ya está suma 1 a esa línea (no crea otra línea). "Editar carta" abre la gestión de platos actual.
- **Más pedidos:** cuando el buscador de platos está vacío, botones con los 6 más pedidos de los últimos 30 días (ver "Datos"). Un toque agrega el plato; si ya está en el pedido muestra "×N" y borde oscuro. Si no hay datos o no hay platos, no se muestra la sección.
- **Líneas:** cantidad con − / +, nombre, precio editable, quitar.
- **Pago** (Efectivo / Tarjeta segmentado), **Entrega** (hora), **Observaciones**.
- **Pie:** "Total · Efectivo" y el monto grande; botón rojo "Enviar a cocina" (gris si falta cliente o platos; "Enviando…" mientras guarda).
- Se mantiene: F2 enfoca el buscador de cliente, el formulario colapsable en celular, y que si el envío falla no se borra lo cargado.

### Gestor — Pedidos
- Pestañas "En curso N" y la de historial (hoy "Total del día"; en el diseño "Cerrados hoy"). El título de la pestaña de historial refleja el filtro elegido ("Cerrados hoy", "Cerrados ayer", "Cerrados 12/10").
- **En curso:** grilla de tarjetas como el diseño (franja de urgencia con hora grande, cuenta regresiva e "Ingresó HH:MM"; nombre, dirección, ítems "2× Milanesa", observaciones en amarillo, monto + método, Editar / Eliminar / Despachar). Editar mantiene la edición en la tarjeta que existe hoy (no mueve el pedido al formulario como el prototipo). Estado vacío "Sin pedidos en curso".
- **Historial:** tabla del diseño (Entrega, Cliente, Pedido, Pago, Monto) con totales Efectivo / Tarjeta / total. Conserva el calendario para elegir día y el detalle por método de pago al tocar Efectivo o Tarjeta (hoy `PaymentModal`). En celular la tabla se convierte en lista.

### Comanda (cocina y dueño)
- Pantalla oscura del diseño: título "Comanda · N en curso", leyenda de colores, tarjetas grandes (hora 28 px, cuenta regresiva, nombre 20 px, ítems 19 px con cantidad en amarillo, observaciones en amarillo, "Cobrar $X" y método).
- Para el usuario de cocina la cabecera es la versión oscura con logo y Salir / cambiar contraseña, como hoy pero en el estilo nuevo.

### Estadísticas
- Título, filtro segmentado Hoy / Semana / Mes, tres KPIs grandes (venta total, ticket promedio, recurrencia), con los datos reales.
- Se conservan las secciones actuales (top 5 platos, ventas por hora, segmentación de clientes nuevos / fieles) rediseñadas con las tarjetas, barras y rankings del diseño. El gráfico de ventas usa `ventasPorHora` (lo que hoy existe); la barra Efectivo / Tarjeta usa la distribución de pago de ese período.
- Sigue detrás de "Cargando historial…".

### Resto
- Login, cambiar contraseña, modales de gestión, popover de calendario, `/unir-clientes` y el aviso "Cargando historial…" se pasan al estilo nuevo sin cambiar su comportamiento.

## Datos: platos más pedidos

- Nueva función pura `topPlatos(pedidos, platos, n = 6)` (en `src/lib/pedidos.js`): usa `rankDishes` sobre los pedidos y devuelve los **platos de la carta** (objetos de `platos`) en orden de cantidad, emparejando por nombre normalizado. Los nombres que no están en la carta se descartan.
- Para no depender del historial completo, el store hace al abrir una consulta liviana: `pedidos` con `select('pedido')`, `estado = 'listo'`, `timestamp_creacion >= hace 30 días` (paginada con `fetchAll`). Se calcula una vez por sesión; no se actualiza en vivo (decisión de Claude: el ranking de 30 días no cambia por un pedido).
- 6 platos y 30 días son decisiones de Claude, fáciles de cambiar (constantes).

## Restricciones

- React 19, Vite 7, Tailwind 4, `lucide-react`. Sin librerías nuevas (las fuentes salen de Google Fonts como hoy).
- La lógica no visual (store, `src/lib`, SQL) no cambia salvo lo de "Datos".
- Tests `node --test` para `topPlatos`; lint 0 errores; build OK.
- La PWA (manifest, `theme_color`, íconos) se actualiza al color de fondo nuevo si corresponde.

## Lo que queda al implementador

- Estructura de componentes, siempre que se reutilice lo existente (store, hooks, `src/lib`).
- Adaptación a celular de cada pantalla.
- Animaciones y estados hover.
- Textos exactos de la UI no fijados arriba.
