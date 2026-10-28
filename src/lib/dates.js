const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isISODate(value) {
    return typeof value === 'string' && ISO_DATE_RE.test(value);
}

// Fecha local en formato YYYY-MM-DD. No usar toISOString(): convierte a UTC y
// en Argentina después de las 21 h devuelve el día siguiente.
export function toLocalISODate(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function parseLocalISODate(value) {
    return new Date(value + 'T00:00:00');
}

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function startOfWeek(date) {
    const d = startOfDay(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); // Semana empieza el lunes
    return d;
}

function startOfMonth(date) {
    const d = startOfDay(date);
    d.setDate(1);
    return d;
}

function startOfYear(date) {
    const d = startOfDay(date);
    d.setMonth(0, 1);
    return d;
}

// Devuelve { since, until } para un filtro: 'dia' | 'semana' | 'mes' | 'año' | 'YYYY-MM-DD'.
// `until` es null cuando el rango llega hasta ahora.
export function getDateRange(filter, now = new Date()) {
    if (isISODate(filter)) {
        const since = parseLocalISODate(filter);
        const until = new Date(since);
        until.setHours(23, 59, 59, 999);
        return { since, until };
    }

    switch (filter) {
        case 'semana': return { since: startOfWeek(now), until: null };
        case 'mes': return { since: startOfMonth(now), until: null };
        case 'año': return { since: startOfYear(now), until: null };
        case 'dia':
        default: return { since: startOfDay(now), until: null };
    }
}

export function filterOrdersByDateRange(pedidos, filter, now = new Date()) {
    const { since, until } = getDateRange(filter, now);
    return pedidos.filter(p => {
        const d = new Date(p.timestamp_creacion);
        return d >= since && (!until || d <= until);
    });
}

// Fecha que muestra el calendario como seleccionada para un filtro.
export function filterToCalendarDate(filter) {
    return isISODate(filter) ? filter : toLocalISODate();
}

export function formatFilterLabel(filter, now = new Date()) {
    if (filter === 'dia') return 'HOY';
    if (filter === 'semana') return 'SEM';
    if (filter === 'mes') return 'MES';

    if (isISODate(filter)) {
        const diffDays = Math.round((startOfDay(now) - parseLocalISODate(filter)) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'HOY';
        if (diffDays === 1) return 'AYER';
        const [, m, d] = filter.split('-');
        return `${d}/${m}`;
    }
    return String(filter).toUpperCase();
}

export function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Momento de entrega de un pedido: el horario "HH:MM" en el día en que se creó.
// Si el horario quedó más de una hora antes de la creación (ej. pedido a las 23:40
// para las 00:15) se asume que es para el día siguiente.
export function getDeliveryDate(order) {
    if (!order.horario_entrega) return null;
    const [h, m] = order.horario_entrega.split(':').map(Number);
    const created = new Date(order.timestamp_creacion);
    const target = new Date(created);
    target.setHours(h, m, 0, 0);
    if (created - target > 60 * 60 * 1000) target.setDate(target.getDate() + 1);
    return target;
}

// Hora de creación; si el pedido no es de hoy antepone la fecha ("26/10 21:30").
export function formatOrderStart(timestamp, now = new Date()) {
    const d = new Date(timestamp);
    if (toLocalISODate(d) === toLocalISODate(now)) return formatTime(d);
    return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} ${formatTime(d)}`;
}
