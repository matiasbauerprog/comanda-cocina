import { normalizeSearch } from './clientes.js';

// Búsqueda de platos del formulario: todas las palabras tienen que estar en el nombre,
// en cualquier orden. Primero los que contienen la búsqueda entera, más adelante peor.
export function searchPlatos(platos, query) {
    const q = normalizeSearch(query);
    if (!q) return [];
    const words = q.split(' ');
    const position = (nombre) => {
        const i = normalizeSearch(nombre).indexOf(q);
        return i === -1 ? Infinity : i;
    };
    return platos
        .filter(p => words.every(w => normalizeSearch(p.nombre).includes(w)))
        .sort((a, b) => position(a.nombre) - position(b.nombre) || a.nombre.localeCompare(b.nombre));
}

// Agregar un plato al pedido: si ya está, suma uno a esa línea.
export function addLine(lines, plato) {
    if (lines.some(l => l.platoId === plato.id)) {
        return lines.map(l => (l.platoId === plato.id ? { ...l, cantidad: l.cantidad + 1 } : l));
    }
    return [...lines, { platoId: plato.id, nombre: plato.nombre, monto: plato.monto, cantidad: 1 }];
}
