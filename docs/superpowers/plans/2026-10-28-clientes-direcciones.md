# Clientes con varias direcciones — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Buscador en la gestión de clientes/platos, clientes con varias direcciones etiquetadas, y una página `/unir-clientes` para que el dueño una duplicados.

**Architecture:** Toda la lógica pura (normalizar, buscar, direcciones, sugerencias de unión) va en `src/lib/clientes.js` con tests `node --test`. La base gana una columna `clientes.direcciones jsonb` y una función transaccional `unir_clientes` (SQL que corre el usuario). La UI consume esa lógica: ManageModal, OrderForm y una vista nueva enrutada por `window.location.pathname`.

**Tech Stack:** React 19, Vite 7, Tailwind 4, supabase-js 2, Postgres (Supabase), `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-28-clientes-direcciones-design.md`

## Global Constraints

- Sin router ni dependencias nuevas.
- Solo `owner` escribe en `clientes` y `pedidos` (RLS ya existente); la función de unión es `security invoker`.
- Los pedidos se siguen guardando con `cliente_nombre` y `cliente_direccion` como texto.
- La columna `clientes.direccion` no se borra; el código la sigue escribiendo con la primera dirección o `''`.
- El SQL nunca borra datos salvo dentro de `unir_clientes`, y empieza creando `clientes_backup_20261028` y `pedidos_backup_20261028`.
- Imports entre archivos de `src/lib` con extensión `.js` (para `node --test`).
- Estilo: 4 espacios en componentes, 2 en `App.jsx`; comentarios en español, escasos.
- `npm run lint` en 0 errores, `npm test` y `npm run build` pasan al final de cada tarea.
- No se publica (push a `main`) ni se corre SQL en Supabase sin que el usuario lo pida.

## Review Focus

- Cliente sin `direcciones` (o `[]`) pero con `direccion` vieja, p. ej. si el SQL no se corrió o llega por realtime: tiene que verse y usarse esa dirección → test en Task 1 (`getDirecciones`).
- Pedidos viejos con el nombre en otra capitalización o con espacios ("mariana casa ") deben renombrarse igual al unir → `lower(trim())` en Task 2, y `nombresViejos` normalizados en Task 1.
- Dos clientes del grupo con la misma dirección escrita distinto ("Av. Siempreviva 742" / "av siempreviva 742 ") → una sola dirección tras unir → test en Task 1 (`mergeGroup`).
- Nombre común de una palabra ("Juan") agrupando personas distintas → todos tildados por defecto pero destildables, y un grupo con menos de 2 tildados no se puede unir → Task 7.
- Búsqueda con tildes y mayúsculas mezcladas ("JOSÉ" vs "jose") → test en Task 1 (`matchesSearch`).

---

### Task 1: Lógica pura de clientes

**Files:**
- Create: `src/lib/clientes.js`
- Test: `tests/clientes.test.js`

**Interfaces:**
- Produces (todo exportado desde `src/lib/clientes.js`):
  - `normalizeSearch(text: string|null) -> string` — minúsculas, sin diacríticos (`normalize('NFD')` + quitar `\p{Diacritic}`), espacios colapsados y trim.
  - `matchesSearch(query: string, ...texts: (string|null)[]) -> boolean` — query vacía → true; si no, algún texto normalizado contiene la query normalizada.
  - `getDirecciones(cliente) -> {etiqueta: string, direccion: string}[]` — usa `cliente.direcciones` si es array no vacío; si no, `[{etiqueta:'', direccion: cliente.direccion}]` cuando `direccion` no está vacía; si no, `[]`.
  - `direccionLabel(d) -> string` — la etiqueta si tiene, si no la dirección.
  - `hasDireccion(direcciones, texto: string) -> boolean` — compara con `normalizeSearch`.
  - `addDireccion(direcciones, texto: string, etiqueta = '') -> array` — agrega al final si no está y no es vacía; devuelve el mismo contenido si ya existe.
  - `toClienteRow({nombre, direcciones}) -> {nombre, direcciones, direccion}` — trim de nombre, descarta direcciones vacías, `direccion` = primera o `''`.
  - `suggestGroups(clientes, dismissed: string[]) -> {key: string, clientes: cliente[]}[]` — agrupa por primera palabra normalizada del nombre, solo grupos de ≥2, excluye keys en `dismissed`, clientes de cada grupo ordenados por `created_at` ascendente.
  - `mergeGroup(clientes: cliente[]) -> {keepId, deleteIds, nombre, direcciones, nombresViejos}` — primero ordena por `created_at` ascendente y todo lo demás sigue ese orden; `keepId` = el más antiguo; `nombre` propuesto = primera palabra del nombre del más antiguo con su capitalización; `direcciones` = todas las de `getDirecciones` de cada cliente en orden, con etiqueta vacía reemplazada por el resto del nombre tras la primera palabra (en minúsculas tal cual), deduplicadas por `normalizeSearch(direccion)` (gana la primera); `nombresViejos` = nombres originales sin trim.

- [ ] **Step 1: Write the failing tests** en `tests/clientes.test.js`:

```js
test('matchesSearch ignora mayúsculas y tildes', () => {
    assert.equal(matchesSearch('jose', 'JOSÉ Pérez'), true);
    assert.equal(matchesSearch('marian', 'Mariana casa'), true);
    assert.equal(matchesSearch('perez', null, 'Av. Pérez 12'), true);
    assert.equal(matchesSearch('', 'lo que sea'), true);
    assert.equal(matchesSearch('flan', 'Milanesa'), false);
});

test('getDirecciones usa la columna vieja si no hay lista', () => {
    assert.deepEqual(getDirecciones({ direccion: 'Calle 1', direcciones: [] }), [{ etiqueta: '', direccion: 'Calle 1' }]);
    assert.deepEqual(getDirecciones({ direccion: 'Calle 1' }), [{ etiqueta: '', direccion: 'Calle 1' }]);
    assert.deepEqual(getDirecciones({ direccion: '' }), []);
    const lista = [{ etiqueta: 'Casa', direccion: 'Calle 2' }];
    assert.deepEqual(getDirecciones({ direccion: 'Calle 1', direcciones: lista }), lista);
});

test('addDireccion no duplica direcciones escritas distinto', () => {
    const dirs = [{ etiqueta: 'Casa', direccion: 'Av. Siempreviva 742' }];
    assert.equal(addDireccion(dirs, ' av. siempreviva  742').length, 1);
    assert.equal(addDireccion(dirs, '').length, 1);
    assert.deepEqual(addDireccion(dirs, 'Otra 5').at(-1), { etiqueta: '', direccion: 'Otra 5' });
});

test('toClienteRow sincroniza la columna vieja', () => {
    assert.deepEqual(
        toClienteRow({ nombre: ' Ana ', direcciones: [{ etiqueta: '', direccion: ' ' }, { etiqueta: 'Casa', direccion: 'Calle 1' }] }),
        { nombre: 'Ana', direcciones: [{ etiqueta: 'Casa', direccion: 'Calle 1' }], direccion: 'Calle 1' },
    );
    assert.equal(toClienteRow({ nombre: 'Ana', direcciones: [] }).direccion, '');
});

test('suggestGroups agrupa por primera palabra y respeta descartados', () => {
    const c = [
        { id: 1, nombre: 'Mariana trabajo', created_at: '2026-02-01' },
        { id: 2, nombre: 'mariana Casa', created_at: '2026-01-01' },
        { id: 3, nombre: 'Beto', created_at: '2026-01-01' },
    ];
    const groups = suggestGroups(c, []);
    assert.equal(groups.length, 1);
    assert.deepEqual(groups[0].clientes.map(x => x.id), [2, 1]);
    assert.deepEqual(suggestGroups(c, [groups[0].key]), []);
});

test('mergeGroup conserva el más antiguo, etiqueta y deduplica', () => {
    const m = mergeGroup([
        { id: 'b', nombre: 'Mariana trabajo', created_at: '2026-02-01', direccion: 'Oficina 9' },
        { id: 'a', nombre: 'Mariana casa', created_at: '2026-01-01', direccion: 'Calle 1' },
        { id: 'c', nombre: 'Mariana', created_at: '2026-03-01', direccion: 'calle 1 ' },
    ]);
    assert.equal(m.keepId, 'a');
    assert.deepEqual(m.deleteIds, ['b', 'c']);
    assert.equal(m.nombre, 'Mariana');
    assert.deepEqual(m.direcciones, [
        { etiqueta: 'casa', direccion: 'Calle 1' },
        { etiqueta: 'trabajo', direccion: 'Oficina 9' },
    ]);
    assert.deepEqual(m.nombresViejos, ['Mariana casa', 'Mariana trabajo', 'Mariana']);
});
```

- [ ] **Step 2: Run `npm test`** — Expected: FAIL, no se puede importar `../src/lib/clientes.js`.
- [ ] **Step 3: Implement** las funciones del bloque Interfaces en `src/lib/clientes.js`. Mover `clienteKey` no hace falta; queda en `pedidos.js`.
- [ ] **Step 4: Run `npm test`** — Expected: todos PASS (los 10 previos + 6 nuevos).
- [ ] **Step 5: Commit** — `git add src/lib/clientes.js tests/clientes.test.js && git commit -m "Lógica de clientes: búsqueda, direcciones y sugerencias de unión"`

### Task 2: SQL de migración y función de unión

**Files:**
- Create: `supabase/clientes-direcciones.sql`
- Modify: `README.md` (sección de Supabase: cuándo correr este archivo)

**Interfaces:**
- Produces: `public.unir_clientes(p_keep_id text, p_nombre text, p_direcciones jsonb, p_delete_ids text[], p_nombres_viejos text[]) returns void`, llamada desde el cliente como `supabase.rpc('unir_clientes', { p_keep_id, p_nombre, p_direcciones, p_delete_ids, p_nombres_viejos })`. Los ids van como texto y se comparan con `id::text` para no depender de si `id` es uuid o bigint.

- [ ] **Step 1: Write el archivo**, en este orden y con un comentario por bloque al estilo de `supabase/setup.sql`:
  1. `create table if not exists public.clientes_backup_20261028 as select * from public.clientes;` y lo mismo para `pedidos`; `alter table … enable row level security` en ambas, sin políticas.
  2. `alter table public.clientes add column if not exists direcciones jsonb not null default '[]'::jsonb;`
  3. `update public.clientes set direcciones = jsonb_build_array(jsonb_build_object('etiqueta','','direccion', direccion)) where direcciones = '[]'::jsonb and coalesce(trim(direccion),'') <> '';`
  4. La función, `language plpgsql security invoker set search_path = public`, que: actualiza el cliente `p_keep_id` (nombre, direcciones, `direccion` = `coalesce(p_direcciones->0->>'direccion','')`); `update pedidos set cliente_nombre = p_nombre where lower(trim(cliente_nombre)) = any(select lower(trim(x)) from unnest(p_nombres_viejos) x)`; `delete from clientes where id::text = any(p_delete_ids) and id::text <> p_keep_id`. Si el update del cliente conservado no afecta filas (RLS o id inexistente) → `raise exception 'No se pudo actualizar el cliente'` para que nada se aplique.
  5. Un `select` de verificación: cantidad de filas en clientes y en el backup.
- [ ] **Step 2: Verificar** que el archivo es idempotente leyéndolo: correrlo dos veces no duplica respaldos ni direcciones (`if not exists`, condición `direcciones = '[]'`), y `create or replace function`.
- [ ] **Step 3: README** — agregar: "Antes de publicar la versión con direcciones, correr `supabase/clientes-direcciones.sql` una vez."
- [ ] **Step 4: Commit** — `git commit -m "SQL: respaldo, columna direcciones y función unir_clientes"`

### Task 3: Store

**Files:**
- Modify: `src/store/StoreProvider.jsx` (bloque "Clientes CRUD", ~líneas 129-136, y el value del contexto ~221)

**Interfaces:**
- Consumes: `toClienteRow` (Task 1), `unir_clientes` (Task 2).
- Produces en `useStore()`:
  - `addCliente({nombre, direcciones}) -> Promise<boolean>`
  - `updateCliente(id, {nombre, direcciones}) -> Promise<boolean>`
  - `unirClientes({keepId, deleteIds, nombre, direcciones, nombresViejos}) -> Promise<boolean>`

- [ ] **Step 1: Implement** — `addCliente`/`updateCliente` mandan `toClienteRow(data)`. `unirClientes` usa `runMutation('unir clientes', supabase.rpc('unir_clientes', {...}))` pasando `p_keep_id: String(keepId)` y `p_delete_ids: deleteIds.map(String)`, y `p_direcciones` filtradas con `toClienteRow`. Realtime ya actualiza clientes y pedidos; no se hace refetch.
- [ ] **Step 2: Run `npm run lint && npm test && npm run build`** — Expected: 0 errores, PASS, build OK.
- [ ] **Step 3: Commit** — `git commit -m "Store: clientes con direcciones y unirClientes"`

### Task 4: Buscador en ManageModal y CustomDropdown

**Files:**
- Modify: `src/components/ManageModal.jsx`, `src/components/CustomDropdown.jsx:16-19`

**Interfaces:**
- Consumes: `matchesSearch` (Task 1).
- Produces: ManageModal acepta `getSearchTexts?: (item) => string[]` (default `item => [item.nombre]`).

- [ ] **Step 1: Implement** — en ManageModal, estado `query` y un input "Buscar…" (icono `Search`) entre el formulario de alta y la lista; la lista muestra `items.filter(item => matchesSearch(query, ...getSearchTexts(item)))`. Si hay query y no hay resultados: "Sin resultados para «query»". En CustomDropdown reemplazar el filtro por `matchesSearch(search, opt.label, opt.detail)`.
- [ ] **Step 2: Verificar a mano** con `npm run dev`: en Gestionar Platos y Gestionar Clientes, escribir parte de un nombre con otra capitalización filtra la lista.
- [ ] **Step 3: Run lint/test/build** — Expected: todo OK.
- [ ] **Step 4: Commit** — `git commit -m "Buscador en la gestión de clientes y platos"`

### Task 5: Editar direcciones en la gestión de clientes

**Files:**
- Create: `src/components/DireccionesEditor.jsx`
- Modify: `src/components/ManageModal.jsx`, `src/components/OrderForm.jsx:330-343`

**Interfaces:**
- Consumes: `getDirecciones`, `direccionLabel` (Task 1); `addCliente`, `updateCliente` (Task 3); `getSearchTexts` (Task 4).
- Produces:
  - `DireccionesEditor({ value: Direccion[], onChange: (Direccion[]) => void })` — una fila por dirección (input etiqueta angosto + input dirección + borrar) y botón "+ Dirección" que agrega `{etiqueta:'', direccion:''}`.
  - ManageModal acepta `extraField?: { key: string, empty: any, fromItem: (item) => any, render: (value, onChange) => ReactNode }` y `renderDetail?: (item) => ReactNode`. `extraField` se suma al form de alta y al de edición (debajo de los inputs de `fields`); `renderDetail` reemplaza la línea de detalle (`item.direccion`/`item.monto`) en la vista normal.

- [ ] **Step 1: Implement** `DireccionesEditor` y las dos props de ManageModal. Platos no las pasa y no cambia.
- [ ] **Step 2: Implement** en OrderForm el ManageModal de clientes: `fields` solo `nombre`; `extraField = { key:'direcciones', empty: [], fromItem: getDirecciones, render: (v, on) => <DireccionesEditor value={v} onChange={on} /> }`; `renderDetail` lista cada dirección como "**Etiqueta** · dirección"; `getSearchTexts = c => [c.nombre, ...getDirecciones(c).flatMap(d => [d.etiqueta, d.direccion])]`; `onAdd`/`onUpdate` pasan `{nombre, direcciones}`.
- [ ] **Step 3: Verificar a mano**: alta de cliente con 2 direcciones, editar etiqueta, borrar una; se ven en la lista; buscar por la dirección encuentra al cliente; un cliente viejo (solo `direccion`) muestra su dirección al editar.
- [ ] **Step 4: Run lint/test/build** y **Commit** — `git commit -m "Gestión de clientes con varias direcciones"`

### Task 6: Direcciones en el nuevo pedido

**Files:**
- Modify: `src/components/OrderForm.jsx` (`handleClienteSelect` ~54-62, opciones del dropdown ~158-163, input de dirección ~165-171)

**Interfaces:**
- Consumes: `getDirecciones`, `direccionLabel`, `hasDireccion`, `addDireccion` (Task 1); `updateCliente` (Task 3).

- [ ] **Step 1: Implement**:
  - `handleClienteSelect` precarga `getDirecciones(c)[0]?.direccion ?? ''`.
  - `detail` del dropdown = `getDirecciones(c).map(d => d.direccion).join(' · ')`.
  - Con cliente elegido y ≥1 dirección: chips bajo el input (texto `direccionLabel(d)`); tocar uno copia `d.direccion` al input; el chip cuya dirección coincide (`normalizeSearch`) con el input se ve activo.
  - Si `direccion.trim()` no es vacía y `!hasDireccion(dirs, direccion)`: botón "Guardar en el cliente" que llama `updateCliente(id, { nombre: c.nombre, direcciones: addDireccion(dirs, direccion) })`; mientras guarda se deshabilita.
- [ ] **Step 2: Verificar a mano**: elegir cliente con 2 direcciones → chips, la primera cargada; escribir una nueva → aparece el botón, guardarla → aparece como chip y el botón desaparece; el pedido se guarda con la dirección del input.
- [ ] **Step 3: Run lint/test/build** y **Commit** — `git commit -m "Nuevo pedido: elegir y guardar direcciones del cliente"`

### Task 7: Página /unir-clientes

**Files:**
- Create: `src/views/UnirClientesView.jsx`, `vercel.json`
- Modify: `src/App.jsx` (`AppContent`)

**Interfaces:**
- Consumes: `suggestGroups`, `mergeGroup`, `matchesSearch`, `direccionLabel` (Task 1); `clientes`, `pedidos`, `unirClientes` (Task 3).
- Produces: `UnirClientesView()` sin props.

- [ ] **Step 1: `vercel.json`** — `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`. Vercel sirve primero los archivos estáticos que existen, así que assets, `sw.js` y `manifest.json` no se ven afectados.
- [ ] **Step 2: Routing en `App.jsx`** — en `AppContent`, si `window.location.pathname === '/unir-clientes'`: rol `kitchen` → `FullScreenMessage` "Solo Gaspi puede usar esta página" con botón Salir; rol `owner` → header simple (logo + "Unir clientes" + botón "Volver a la app" que hace `window.location.assign('/')` + `HeaderActions`) y `<UnirClientesView />`. Los estados de carga/error de datos se mantienen antes. El login no navega, así que la URL se conserva sola.
- [ ] **Step 3: Implement `UnirClientesView`**:
  - Descartados: `localStorage` key `gaspacho-unir-descartados` (array de keys), leído/escrito con try/catch.
  - Sección "Sugerencias": una tarjeta por `suggestGroups(clientes, descartados)`. Estado local por tarjeta inicializado con `mergeGroup(grupo.clientes)`: input de nombre final, checkbox por cliente (todos tildados; al cambiar, se recalcula `mergeGroup` de los tildados conservando el nombre editado), lista de direcciones con etiqueta editable, cantidad de pedidos afectados (`pedidos` cuyo `clienteKey(cliente.nombre)` está en los `clienteKey` de `nombresViejos`).
  - Botón "Unir" deshabilitado si hay <2 tildados o nombre vacío; `window.confirm("Se unen N clientes en «nombre». M pedidos pasan a llamarse «nombre». No se puede deshacer.")` → `unirClientes(...)`. Botón "No son la misma persona" agrega la key a descartados.
  - Sección "Unir a mano": input de búsqueda (`matchesSearch` sobre nombre y direcciones) y lista con checkboxes; con ≥2 tildados aparece la misma tarjeta de unión. Tras unir se limpia la selección.
  - Sin sugerencias: "No hay clientes parecidos para revisar."
- [ ] **Step 4: Verificar a mano** con `npm run dev` en `http://localhost:5173/unir-clientes` (Vite ya sirve el SPA en cualquier ruta): sin sesión → login → queda en la página; las sugerencias aparecen; destildar recalcula; "No son la misma persona" lo oculta y sobrevive a recargar. **No apretar "Unir" contra la base real**; la prueba de la unión la hace el usuario después de correr el SQL.
- [ ] **Step 5: Run lint/test/build** y **Commit** — `git commit -m "Página para unir clientes duplicados"`

### Task 8: Cierre

- [ ] **Step 1:** `npm run lint && npm test && npm run build` — Expected: 0 errores, todos PASS, build OK.
- [ ] **Step 2:** Revisar `git diff main --stat` y que no quedó nada sin commitear.
- [ ] **Step 3:** Informar al usuario el orden de publicación: (1) correr `supabase/clientes-direcciones.sql` en Supabase, (2) recién entonces push a `main`. No ejecutar ninguno de los dos sin su pedido.
