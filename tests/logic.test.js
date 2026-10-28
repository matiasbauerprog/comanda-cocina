import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePedidoItems, formatPedidoText, rankDishes, sortByDeliveryTime } from '../src/lib/pedidos.js';
import { toLocalISODate, getDeliveryDate, filterOrdersByDateRange, formatFilterLabel } from '../src/lib/dates.js';
import { computeKPIs, computeAnalyticsKPIs } from '../src/store/kpis.js';

function pedido(overrides) {
    return {
        id: Math.random(),
        estado: 'listo',
        monto: 100,
        metodo_pago: 'Efectivo',
        pedido: 'Milanesa',
        horario_entrega: '',
        timestamp_creacion: new Date(2026, 9, 27, 12, 0).toISOString(),
        cliente: { nombre: 'Ana', direccion: '' },
        ...overrides,
    };
}

test('parsePedidoItems lee cantidades y descarta el envío', () => {
    assert.deepEqual(parsePedidoItems('(2) Milanesa, Flan, Envio 1'), [
        { name: 'milanesa', qty: 2 },
        { name: 'flan', qty: 1 },
    ]);
    assert.deepEqual(parsePedidoItems(''), []);
    assert.deepEqual(parsePedidoItems(null), []);
});

test('formatPedidoText es la inversa de parsePedidoItems', () => {
    const text = formatPedidoText([{ nombre: 'Milanesa', cantidad: 2 }, { nombre: 'Flan', cantidad: 1 }]);
    assert.equal(text, '(2) Milanesa, Flan');
    assert.deepEqual(parsePedidoItems(text), [{ name: 'milanesa', qty: 2 }, { name: 'flan', qty: 1 }]);
});

test('rankDishes suma "(2) Milanesa" y "Milanesa" como el mismo plato', () => {
    const ranking = rankDishes([pedido({ pedido: '(2) Milanesa' }), pedido({ pedido: 'milanesa, Flan' })]);
    assert.deepEqual(ranking, [{ name: 'milanesa', count: 3 }, { name: 'flan', count: 1 }]);
});

test('toLocalISODate usa la fecha local, no UTC', () => {
    assert.equal(toLocalISODate(new Date(2026, 9, 27, 23, 30)), '2026-10-27');
});

test('getDeliveryDate usa el día de creación y pasa al día siguiente después de medianoche', () => {
    const created = new Date(2026, 9, 26, 20, 0);
    const same = getDeliveryDate({ horario_entrega: '21:15', timestamp_creacion: created.toISOString() });
    assert.equal(same.getTime(), new Date(2026, 9, 26, 21, 15).getTime());

    const lateNight = new Date(2026, 9, 26, 23, 40);
    const next = getDeliveryDate({ horario_entrega: '00:15', timestamp_creacion: lateNight.toISOString() });
    assert.equal(next.getTime(), new Date(2026, 9, 27, 0, 15).getTime());

    assert.equal(getDeliveryDate({ horario_entrega: '', timestamp_creacion: created.toISOString() }), null);
});

test('sortByDeliveryTime pone primero los que tienen horario, del más próximo al más lejano', () => {
    const sorted = sortByDeliveryTime([
        pedido({ id: 'sin', horario_entrega: '' }),
        pedido({ id: 'tarde', horario_entrega: '21:00' }),
        pedido({ id: 'temprano', horario_entrega: '13:00' }),
    ]);
    assert.deepEqual(sorted.map(p => p.id), ['temprano', 'tarde', 'sin']);
});

test('filterOrdersByDateRange filtra por día específico y por "hoy"', () => {
    const now = new Date(2026, 9, 27, 18, 0);
    const ayer = pedido({ id: 'ayer', timestamp_creacion: new Date(2026, 9, 26, 22, 0).toISOString() });
    const hoy = pedido({ id: 'hoy', timestamp_creacion: new Date(2026, 9, 27, 10, 0).toISOString() });

    assert.deepEqual(filterOrdersByDateRange([ayer, hoy], 'dia', now).map(p => p.id), ['hoy']);
    assert.deepEqual(filterOrdersByDateRange([ayer, hoy], '2026-10-26', now).map(p => p.id), ['ayer']);
    assert.deepEqual(filterOrdersByDateRange([ayer, hoy], 'semana', now).map(p => p.id), ['ayer', 'hoy']);
});

test('formatFilterLabel', () => {
    const now = new Date(2026, 9, 27, 18, 0);
    assert.equal(formatFilterLabel('dia', now), 'HOY');
    assert.equal(formatFilterLabel('2026-10-27', now), 'HOY');
    assert.equal(formatFilterLabel('2026-10-26', now), 'AYER');
    assert.equal(formatFilterLabel('2026-10-01', now), '01/10');
});

test('computeKPIs solo cuenta pedidos despachados', () => {
    const kpis = computeKPIs([
        pedido({ monto: 100, metodo_pago: 'Efectivo' }),
        pedido({ monto: 250, metodo_pago: 'Tarjeta', pedido: '(2) Flan' }),
        pedido({ monto: 999, estado: 'pendiente' }),
    ]);
    assert.equal(kpis.totalVendido, 350);
    assert.equal(kpis.pedidosCompletados, 2);
    assert.deepEqual(kpis.distribucionPago, { Efectivo: 100, Tarjeta: 250 });
    assert.deepEqual(kpis.ranking, [{ name: 'flan', count: 2 }, { name: 'milanesa', count: 1 }]);
});

test('computeAnalyticsKPIs segmenta clientes por historial', () => {
    const todos = [
        pedido({ cliente: { nombre: 'Ana' } }),
        pedido({ cliente: { nombre: 'ana ' } }),
        pedido({ cliente: { nombre: 'Ana' } }),
        pedido({ cliente: { nombre: 'Beto' } }),
        pedido({ cliente: { nombre: 'Caro' }, estado: 'pendiente' }),
    ];
    const kpis = computeAnalyticsKPIs(todos, todos);
    assert.equal(kpis.segmentacion.total, 2);
    assert.deepEqual(kpis.segmentacion.fieles.map(c => c.conteo), [3]);
    assert.deepEqual(kpis.segmentacion.nuevos.map(c => c.nombre), ['Beto']);
    assert.equal(kpis.porcentajeRecurrencia, 75); // 3 de 4 pedidos son de Ana
    assert.equal(kpis.ticketPromedio, 100);
});
