import { getDeliveryDate } from './dates.js';
import { normalizeSearch } from './clientes.js';

// Tokens que se cargan como plato pero no lo son (ej. "Envio 1").
const NON_DISH_RE = /^envio\s*\d*$/i;

// Convierte el texto del pedido ("(2) Milanesa, Flan") en [{ name, qty }].
// El nombre se normaliza a minúsculas para poder agrupar.
export function parsePedidoItems(text) {
    return (text || '')
        .split(',')
        .map(i => i.trim())
        .filter(Boolean)
        .map(item => {
            const match = item.match(/^\((\d+)\)\s*(.+)$/);
            return match
                ? { name: match[2].trim().toLowerCase(), qty: parseInt(match[1], 10) }
                : { name: item.toLowerCase(), qty: 1 };
        })
        .filter(({ name }) => !NON_DISH_RE.test(name));
}

// Ítems para mostrar en las tarjetas ("2× Milanesa"), sin normalizar el nombre.
export function pedidoDisplayItems(text) {
    return (text || '')
        .split(',')
        .map(i => i.trim())
        .filter(Boolean)
        .map(item => {
            const match = item.match(/^\((\d+)\)\s*(.+)$/);
            return match ? { qty: parseInt(match[1], 10), name: match[2].trim() } : { qty: 1, name: item };
        });
}

// Inversa de parsePedidoItems: [{ nombre, cantidad }] → "(2) Milanesa, Flan".
export function formatPedidoText(items) {
    return items
        .map(d => (d.cantidad > 1 ? `(${d.cantidad}) ${d.nombre}` : d.nombre))
        .join(', ');
}

// Ranking de platos por unidades vendidas, de mayor a menor.
export function rankDishes(pedidos) {
    const counts = {};
    pedidos.forEach(p => {
        parsePedidoItems(p.pedido).forEach(({ name, qty }) => {
            counts[name] = (counts[name] || 0) + qty;
        });
    });
    return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}

// Platos de la carta más pedidos, para el acceso rápido del formulario. Los nombres
// de pedidos viejos que ya no están en la carta se descartan.
export function topPlatos(pedidos, platos, n = 6) {
    const carta = new Map(platos.map(p => [normalizeSearch(p.nombre), p]));
    return rankDishes(pedidos)
        .map(({ name }) => carta.get(normalizeSearch(name)))
        .filter(Boolean)
        .slice(0, n);
}

// Pedidos con horario de entrega primero (el más próximo arriba), después el resto.
export function sortByDeliveryTime(pedidos) {
    return [...pedidos].sort((a, b) => {
        const da = getDeliveryDate(a);
        const db = getDeliveryDate(b);
        if (da && !db) return -1;
        if (!da && db) return 1;
        if (da && db) return da - db;
        return 0;
    });
}

export function clienteKey(nombre) {
    return (nombre || '').toLowerCase().trim();
}
