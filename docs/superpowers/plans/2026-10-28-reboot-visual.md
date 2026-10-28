# Reboot visual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Toda la app adopta el lenguaje visual del reboot conservando sus funciones, y el formulario de pedido suma búsqueda inline de platos con los 6 más pedidos de los últimos 30 días.

**Architecture:** Primero la lógica pura nueva (más pedidos, búsqueda de platos, líneas, título del historial, distribución de pago en estadísticas) con tests. Después los tokens de tema y piezas de UI compartidas, y recién ahí cada pantalla, una tarea por pantalla. Store y `src/lib` no cambian salvo lo indicado.

**Tech Stack:** React 19, Vite 7, Tailwind 4 (`@theme`), `lucide-react`, supabase-js 2, `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-28-reboot-visual-design.md`
**Referencia visual:** `Gaspacho Reboot/Gaspacho Reboot.dc.html` (estilos inline: copiar medidas, radios, tamaños de letra y colores de ahí).

## Global Constraints

- El diseño es una inspiración: no se pierde ninguna función actual (filtros del Gestor, gestión de clientes con direcciones y de platos, historial con detalle por método de pago, clientes nuevos/fieles, `/unir-clientes`, login, cambio de contraseña, F2, form colapsable en celular, no borrar lo cargado si falla el envío).
- Sin librerías nuevas. Fuentes desde Google Fonts: Bricolage Grotesque (opsz,wght 12..96,500..800), Geist (400–700), Geist Mono (400–600).
- Colores como tokens en `src/index.css` `@theme`; los componentes usan las clases de Tailwind de esos tokens, no hex sueltos (salvo la tabla de urgencia, que vive en un solo módulo).
- Tiene que andar a 375 px de ancho sin scroll horizontal de página.
- Respeta la carga rápida: nada nuevo pide el historial completo al abrir.
- Estilo de código: 4 espacios en componentes, 2 en `App.jsx`; comentarios en español, escasos.
- Cada tarea termina con `npm run lint` (0 errores), `npm test` y `npm run build` OK.
- No se publica sin pedido del usuario.

## Review Focus

- Carta con platos de nombres parecidos ("Milanesa", "Milanesa napolitana") y búsqueda de varias palabras en otro orden ("napo mila") → encuentra, y Enter agrega el mejor resultado → tests en Task 1 (`searchPlatos`).
- Pedidos viejos con platos que ya no están en la carta o escritos en otra capitalización → no rompen los más pedidos ni aparecen botones de platos inexistentes → test en Task 1 (`topPlatos`).
- Tocar dos veces el mismo plato → una sola línea con cantidad 2, no dos líneas → test en Task 1 (`addLine`).
- Celular a 375 px: cabecera con KPIs, tabla de historial y tarjetas sin desbordar → verificación en Tasks 3, 5 y 6.
- Estadísticas de un período sin ventas → sin divisiones por cero en la barra Efectivo/Tarjeta ni en el gráfico → test en Task 1 (`distribucionPago` vacío).

---

### Task 1: Lógica pura nueva

**Files:**
- Modify: `src/lib/pedidos.js`, `src/lib/dates.js`, `src/store/kpis.js`
- Create: `src/lib/orderForm.js`
- Test: `tests/reboot.test.js`

**Interfaces:**
- Produces:
  - `topPlatos(pedidos: {pedido: string}[], platos: Plato[], n = 6) -> Plato[]` en `pedidos.js` — `rankDishes` (ya existe) sobre `pedidos`, emparejado con la carta por `normalizeSearch(nombre)` (de `clientes.js`), descarta nombres fuera de la carta, máximo `n`.
  - `searchPlatos(platos: Plato[], query: string) -> Plato[]` en `orderForm.js` — `[]` si query vacía; cada palabra de la query normalizada tiene que estar en el nombre normalizado; orden por posición de la query completa en el nombre (los que no la contienen entera, al final) y luego alfabético.
  - `addLine(lines: Line[], plato: Plato) -> Line[]` en `orderForm.js` — `Line = {platoId, nombre, monto, cantidad}`; si ya hay línea con ese `platoId` suma 1, si no agrega `{platoId: plato.id, nombre, monto, cantidad: 1}` al final.
  - `historyTitle(filter: string, now = new Date()) -> string` en `dates.js` — `'Cerrados hoy'`, `'Cerrados ayer'`, `'Cerrados DD/MM'`; para `'semana'` / `'mes'`: `'Cerrados esta semana'` / `'Cerrados este mes'`.
  - `computeAnalyticsKPIs` agrega `distribucionPago: { efectivo: number, tarjeta: number, pctEfectivo: number }` (pct entero 0–100; 0 si no hay ventas).

- [ ] **Step 1: Write the failing tests** en `tests/reboot.test.js`:

```js
const carta = [
    { id: 1, nombre: 'Milanesa', monto: 100 },
    { id: 2, nombre: 'Milanesa napolitana', monto: 120 },
    { id: 3, nombre: 'Flan', monto: 50 },
];

test('topPlatos ordena por cantidad y descarta platos fuera de la carta', () => {
    const pedidos = [{ pedido: '(3) Flan, Milanesa' }, { pedido: 'flan, Sushi' }, { pedido: '(2) MILANESA' }];
    assert.deepEqual(topPlatos(pedidos, carta).map(p => p.id), [3, 1]);
    assert.deepEqual(topPlatos(pedidos, carta, 1).map(p => p.id), [3]);
    assert.deepEqual(topPlatos([], carta), []);
});

test('searchPlatos busca todas las palabras en cualquier orden', () => {
    assert.deepEqual(searchPlatos(carta, 'napo mila').map(p => p.id), [2]);
    assert.deepEqual(searchPlatos(carta, 'milanesa').map(p => p.id), [1, 2]);
    assert.deepEqual(searchPlatos(carta, '  '), []);
});

test('addLine suma cantidad si el plato ya está', () => {
    const once = addLine([], carta[0]);
    const twice = addLine(once, carta[0]);
    assert.equal(twice.length, 1);
    assert.equal(twice[0].cantidad, 2);
    assert.deepEqual(addLine(twice, carta[2]).map(l => l.platoId), [1, 3]);
});

test('historyTitle según el filtro', () => {
    const now = new Date(2026, 9, 27, 18, 0);
    assert.equal(historyTitle('dia', now), 'Cerrados hoy');
    assert.equal(historyTitle('2026-10-26', now), 'Cerrados ayer');
    assert.equal(historyTitle('2026-10-12', now), 'Cerrados 12/10');
    assert.equal(historyTitle('semana', now), 'Cerrados esta semana');
});

test('computeAnalyticsKPIs incluye la distribución de pago', () => {
    const p = (monto, metodo_pago) => ({ estado: 'listo', monto, metodo_pago, pedido: 'Flan', timestamp_creacion: new Date().toISOString(), cliente: { nombre: 'A' } });
    const k = computeAnalyticsKPIs([p(300, 'Efectivo'), p(100, 'Tarjeta')], []);
    assert.deepEqual(k.distribucionPago, { efectivo: 300, tarjeta: 100, pctEfectivo: 75 });
    assert.deepEqual(computeAnalyticsKPIs([], []).distribucionPago, { efectivo: 0, tarjeta: 0, pctEfectivo: 0 });
});
```

- [ ] **Step 2: Run `npm test`** — Expected: FAIL (imports inexistentes).
- [ ] **Step 3: Implement** las funciones del bloque Interfaces. Cualquier método que no sea `'Efectivo'` cuenta como tarjeta.
- [ ] **Step 4: Run `npm test`** — Expected: todo PASS.
- [ ] **Step 5: Store** — en `StoreProvider.jsx`, al iniciar la sesión (mismo efecto que la carga inicial, en paralelo y sin bloquear `isInitialized`), traer `fetchAll('pedidos', 'timestamp_creacion', q => q.select('pedido')…)` — ajustar `fetchAll` para aceptar las columnas: `fetchAll(table, orderColumn, applyFilter, columns = '*')` — con `estado = 'listo'` y `timestamp_creacion >= hace 30 días`; guardar en estado `pedidosRecientes`, exponer `masPedidos = useMemo(() => topPlatos(pedidosRecientes, platos), …)`. Constantes `MAS_PEDIDOS_DIAS = 30` y el `n = 6` por defecto. Un error en esta consulta solo se loguea (los botones no aparecen). Se limpia al cerrar sesión.
- [ ] **Step 6: Lint/test/build y commit** — `git commit -m "Lógica: más pedidos, búsqueda de platos, título del historial"`

### Task 2: Tema y piezas compartidas

**Files:**
- Modify: `src/index.css`, `index.html`, `public/manifest.json`
- Create: `src/components/ui/Segmented.jsx`, `src/components/ui/Toast.jsx`, `src/lib/urgency.js`

**Interfaces:**
- Produces:
  - Tokens `@theme` (clases Tailwind): `bg-paper` `#F4F2EC`, `bg-surface` `#FFFFFF`, `bg-soft` `#FAF8F4`, `bg-track` `#EAE6DC`, `border-line` `#E6E2D8`, `border-line-strong` `#DDD8CC`, `border-line-soft` `#EFEBE3`, `text-ink` `#0B1B2E`, `text-ink-2` `#5C6470`, `text-ink-3` `#7A7F88`, `text-ink-4` `#9A9EA6`, `brand-navy` `#002855`, `brand-red` `#E60000`, `brand-yellow` `#FFD700`, `cash` `#0E6B42` / `cash-bg` `#E3F3EA`, `card` `#002855` / `card-bg` `#E8EEF6`, `live` `#12A05C`, Comanda: `night` `#0C1522`, `night-card` `#142033`, `night-line` `#22324A`, `night-ink` `#F4F2EC`, `night-ink-2` `#8796AB`. Fuentes: `--font-display` Bricolage Grotesque, `--font-sans` Geist, `--font-mono` Geist Mono.
  - `URGENCY_THEME` en `src/lib/urgency.js`: la tabla `URG` del diseño tal cual (keys `none|calm|soon|urgent|late`, campos `stripBg, stripFg, border, kBg, kFg, kBorder`). Reemplaza `URGENCY_STYLES` donde se use.
  - `<Segmented options={[{id, label, icon?}]} value onChange size="sm|md" />` — pastilla del diseño (track `bg-track`, activo blanco con sombra suave).
  - `ToastProvider` (envuelve la app en `App.jsx`) y `useToast() -> (msg: string) => void` — aviso abajo al centro del diseño, 2,6 s.

- [ ] **Step 1: Implement** tokens y fuentes (quitar Outfit/Inter/Playfair, `.glass`, `.glass-card` y el fondo con gradientes cuando ya nadie los use — si aún se usan, se quitan en Task 8), `theme-color` y `background_color` a `#F4F2EC` en `index.html`/`manifest.json`, y los tres módulos.
- [ ] **Step 2: Lint/test/build y commit** — `git commit -m "Tema del reboot: tokens, fuentes y piezas compartidas"`

### Task 3: Cabecera y navegación

**Files:**
- Modify: `src/App.jsx`, `src/components/KpiPanel.jsx`, `src/components/DailyOrders.jsx` (quitar `HeaderKpis` de ahí)

**Interfaces:**
- Consumes: `Segmented`, `ToastProvider` (Task 2); `pedidosActivos` del store.

- [ ] **Step 1: Implement** la cabecera del dueño del diseño (logo 36 px + "Gaspacho." + "Pedidos · cocina · ventas"; `Segmented` Gestor / Comanda con contador rojo de `pedidosActivos.length` si >0 / Estadísticas; "En vivo" con punto verde; KPIs; cambiar contraseña; Salir). `KpiPanel` se muestra en la cabecera: valor en mono + etiqueta, con su chip de filtro/calendario y su modal al tocar, todo como hoy. Cabecera de cocina y de `/unir-clientes` en el mismo estilo. En < 1024 px: fila 1 logo + acciones, fila 2 navegación + KPIs con wrap.
- [ ] **Step 2: Verificar** con `npm run build` y revisando a 375 px en las DevTools de `npm run dev` si se puede (sin login solo se ve el login; ver ledger).
- [ ] **Step 3: Lint/test/build y commit** — `git commit -m "Cabecera del reboot con KPIs y navegación"`

### Task 4: Nuevo pedido

**Files:**
- Modify: `src/components/OrderForm.jsx`
- Create: `src/components/order/ClientePicker.jsx`, `src/components/order/PlatoPicker.jsx`

**Interfaces:**
- Consumes: `searchPlatos`, `addLine` (Task 1); `masPedidos` (Task 1); `matchesSearch`, `getDirecciones`, `direccionLabel`, `hasDireccion`, `addDireccion` (`clientes.js`); `Segmented`, `useToast` (Task 2).
- Produces:
  - `ClientePicker({ ref, clientes, cliente, onSelect(id|null), direccion, onDireccion(text), onManage })` — buscador "Buscar por nombre o dirección" con hasta 6 resultados (iniciales, nombre, direcciones) cuando no hay cliente; ficha con "Cambiar", chips de direcciones, input con ícono de pin y "Guardar en el cliente" cuando hay. `ref` enfoca el buscador (F2).
  - `PlatoPicker({ platos, lines, masPedidos, onAdd(plato), onManage })` — buscador "Buscar entre N platos" con resultados (máx. 30) y kbd "↵ agrega"; Enter agrega `searchPlatos(...)[0]` y limpia; Escape limpia; vacío → sección "Más pedidos" con chips (×N si está en `lines`); mensaje "Ningún plato coincide. Revisá la carta en “Editar carta”."

- [ ] **Step 1: Implement** según el diseño: título "Nuevo pedido" + kbd F2, los dos pickers, líneas (− / cantidad / +, nombre, precio editable, quitar), `Segmented` de pago con íconos `Banknote`/`CreditCard`, hora, observaciones, pie con "Total · {método}" y monto grande, botón rojo "Enviar a cocina" (deshabilitado gris). Al enviar bien: `toast('Pedido de {nombre} enviado a cocina')` y foco al buscador de cliente. Se conserva el colapso en celular (cabecera tocable "Nuevo pedido" que expande). `CustomDropdown` deja de usarse acá.
- [ ] **Step 2: Lint/test/build y commit** — `git commit -m "Nuevo pedido del reboot con más pedidos"`

### Task 5: Pedidos en curso e historial

**Files:**
- Modify: `src/components/DailyOrders.jsx`, `src/components/DailyOrderCard.jsx`, `src/components/CalendarPopover.jsx`, `src/components/CalendarPicker.jsx`

**Interfaces:**
- Consumes: `historyTitle` (Task 1); `URGENCY_THEME`, `useToast` (Task 2).

- [ ] **Step 1: Implement**: pestañas tipográficas "En curso N" / `historyTitle(dailyFilter)` N con subrayado; chip de calendario a la derecha (`CalendarPopover` restilado) que solo aparece en la pestaña de historial. Tarjeta en curso según el diseño (franja `URGENCY_THEME[u].stripBg/stripFg`, hora mono 20 px, cuenta regresiva "en 12 min" / "Atrasado 4 min" / "Sin horario", "Ingresó HH:MM"; cuerpo; línea punteada; ítems; observaciones amarillas; pie con monto, badge de pago, Editar, Eliminar, "Despachar"). La edición sigue siendo en la tarjeta (mismos campos que hoy, estilo nuevo). Despachar → `toast('{nombre} despachado')`. Estado vacío del diseño. Historial: tabla del diseño ≥ 640 px; en celular lista de filas apiladas; totales Efectivo / Tarjeta (tocables, abren `PaymentModal` restilado) y total grande.
- [ ] **Step 2: Lint/test/build y commit** — `git commit -m "Pedidos en curso e historial del reboot"`

### Task 6: Comanda

**Files:**
- Modify: `src/views/KitchenView.jsx`, `src/components/KitchenCard.jsx`

- [ ] **Step 1: Implement** la pantalla oscura del diseño: `bg-night`, título "Comanda" + "N en curso" mono, leyenda de 4 colores, grilla `minmax(300px,1fr)`, tarjeta con borde 2 px `kBorder`, franja `kBg/kFg` (hora 28 px, cuenta regresiva 15 px), nombre 20 px, dirección · ingresó, ítems 19 px con cantidad amarilla, observaciones fondo amarillo, pie "Cobrar $X" + método. En celular una columna. Estado vacío "Sin pedidos en curso" en el estilo oscuro.
- [ ] **Step 2: Lint/test/build y commit** — `git commit -m "Comanda oscura del reboot"`

### Task 7: Estadísticas

**Files:**
- Modify: `src/views/AnalyticsView.jsx`, `src/components/analytics/SalesRentability.jsx`, `src/components/analytics/CustomerLoyalty.jsx`

**Interfaces:**
- Consumes: `analyticsKPIs.distribucionPago` (Task 1); `Segmented` (Task 2).

- [ ] **Step 1: Implement**: título "Estadísticas" + "Ventas y fidelización de clientes", `Segmented` Hoy / Semana / Mes (los filtros que existen hoy), 3 KPIs grandes (venta total con "N pedidos", ticket promedio, recurrencia). Tarjeta "Ventas" con barras de `ventasPorHora` (la más alta en rojo, resto navy, etiqueta corta "38k"/"1,2M") y barra Efectivo/Tarjeta con `distribucionPago`. Tarjeta "Platos más pedidos" (ranking con barras, 1° en rojo). Segmentación de clientes nuevos / fieles conservada con el estilo de tarjetas del diseño. Períodos sin datos muestran "Sin ventas en este período" en vez de barras vacías.
- [ ] **Step 2: Lint/test/build y commit** — `git commit -m "Estadísticas del reboot"`

### Task 8: Resto y limpieza

**Files:**
- Modify: `src/views/LoginView.jsx`, `src/components/ChangePasswordModal.jsx`, `src/components/ManageModal.jsx`, `src/components/DireccionesEditor.jsx`, `src/components/HistoryGate.jsx`, `src/views/UnirClientesView.jsx`, `src/index.css`
- Delete si quedó sin uso: `src/components/CustomDropdown.jsx`

- [ ] **Step 1: Implement** el estilo nuevo en cada uno sin cambiar comportamiento (login con `Segmented` Gaspi / Comanda; modales con tarjeta blanca radio 18, borde `line`, sin blur). Quitar del CSS lo que nadie usa (`.glass`, `.glass-card`, gradientes, animaciones huérfanas — verificar con grep antes).
- [ ] **Step 2:** `grep -rnE "glass|font-script|slate-|gray-" src` para encontrar restos del estilo viejo y migrarlos.
- [ ] **Step 3: Lint/test/build y commit** — `git commit -m "Reboot: login, modales y limpieza del estilo viejo"`
