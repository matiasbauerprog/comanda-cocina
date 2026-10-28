// Lógica pura de clientes: búsqueda, direcciones y sugerencias para unir duplicados.

// Minúsculas, sin tildes y con los espacios colapsados: "  JOSÉ  Pérez" -> "jose perez".
export function normalizeSearch(text) {
    return (text || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

export function matchesSearch(query, ...texts) {
    const q = normalizeSearch(query);
    if (!q) return true;
    return texts.some(t => normalizeSearch(t).includes(q));
}

// Los clientes anteriores a la columna `direcciones` solo tienen `direccion`.
export function getDirecciones(cliente) {
    if (Array.isArray(cliente?.direcciones) && cliente.direcciones.length > 0) return cliente.direcciones;
    const direccion = (cliente?.direccion || '').trim();
    return direccion ? [{ etiqueta: '', direccion }] : [];
}

export function direccionLabel(d) {
    return d.etiqueta?.trim() || d.direccion;
}

export function hasDireccion(direcciones, texto) {
    const key = normalizeSearch(texto);
    return direcciones.some(d => normalizeSearch(d.direccion) === key);
}

export function addDireccion(direcciones, texto, etiqueta = '') {
    const direccion = (texto || '').trim();
    if (!direccion || hasDireccion(direcciones, direccion)) return direcciones;
    return [...direcciones, { etiqueta, direccion }];
}

// Fila para Supabase. `direccion` (columna vieja) se mantiene con la primera dirección.
export function toClienteRow({ nombre, direcciones }) {
    const limpias = (direcciones || [])
        .map(d => ({ etiqueta: (d.etiqueta || '').trim(), direccion: (d.direccion || '').trim() }))
        .filter(d => d.direccion);
    return { nombre: (nombre || '').trim(), direcciones: limpias, direccion: limpias[0]?.direccion ?? '' };
}

function firstWord(nombre) {
    return (nombre || '').trim().split(/\s+/)[0] || '';
}

function restOfName(nombre) {
    return (nombre || '').trim().split(/\s+/).slice(1).join(' ');
}

function byCreatedAt(a, b) {
    return String(a.created_at || '').localeCompare(String(b.created_at || ''));
}

export function suggestGroups(clientes, dismissed) {
    const groups = new Map();
    for (const c of clientes) {
        const key = normalizeSearch(firstWord(c.nombre));
        if (!key) continue;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(c);
    }
    return [...groups]
        .filter(([key, list]) => list.length >= 2 && !dismissed.includes(key))
        .map(([key, list]) => ({ key, clientes: [...list].sort(byCreatedAt) }));
}

// Propuesta de unión: se conserva el cliente más antiguo y cada dirección sin etiqueta
// toma el resto del nombre de su cliente ("Mariana casa" -> "casa").
export function mergeGroup(clientes) {
    const sorted = [...clientes].sort(byCreatedAt);
    let direcciones = [];
    for (const c of sorted) {
        for (const d of getDirecciones(c)) {
            direcciones = addDireccion(direcciones, d.direccion, d.etiqueta?.trim() || restOfName(c.nombre));
        }
    }
    return {
        keepId: sorted[0]?.id,
        deleteIds: sorted.slice(1).map(c => c.id),
        nombre: firstWord(sorted[0]?.nombre),
        direcciones,
        nombresViejos: sorted.map(c => c.nombre),
    };
}
