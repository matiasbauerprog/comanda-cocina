export function formatMoney(n) {
    return '$' + Math.round(Number(n) || 0).toLocaleString('es-AR');
}
