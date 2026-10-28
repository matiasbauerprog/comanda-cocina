import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topPlatos, pedidoDisplayItems } from '../src/lib/pedidos.js';
import { searchPlatos, addLine } from '../src/lib/orderForm.js';
import { historyTitle } from '../src/lib/dates.js';
import { computeAnalyticsKPIs } from '../src/store/kpis.js';
import { countdownLabel } from '../src/lib/urgency.js';

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
    assert.equal(k.cantidadPedidos, 2);
    assert.deepEqual(computeAnalyticsKPIs([], []).distribucionPago, { efectivo: 0, tarjeta: 0, pctEfectivo: 0 });
});

test('countdownLabel con el texto del reboot', () => {
    assert.equal(countdownLabel(null), 'Sin horario');
    assert.equal(countdownLabel(0), 'Atrasado 0 min');
    assert.equal(countdownLabel(-4), 'Atrasado 4 min');
    assert.equal(countdownLabel(12), 'en 12 min');
    assert.equal(countdownLabel(65), 'en 1 h 05');
});

test('pedidoDisplayItems conserva el nombre tal cual se cargó', () => {
    assert.deepEqual(pedidoDisplayItems('(2) Milanesa napolitana, Flan'), [{ qty: 2, name: 'Milanesa napolitana' }, { qty: 1, name: 'Flan' }]);
    assert.deepEqual(pedidoDisplayItems(''), []);
});
