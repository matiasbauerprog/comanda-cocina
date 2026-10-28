import { clienteKey, rankDishes } from '../lib/pedidos.js';

// KPIs del header (Total Vendido / Pedidos Despachados).
export function computeKPIs(pedidos) {
    const completados = pedidos.filter(p => p.estado === 'listo');
    const totalVendido = completados.reduce((sum, p) => sum + p.monto, 0);

    const distribucionPago = completados.reduce((acc, p) => {
        acc[p.metodo_pago] = (acc[p.metodo_pago] || 0) + p.monto;
        return acc;
    }, {});

    return {
        totalVendido,
        pedidosCompletados: completados.length,
        distribucionPago,
        ranking: rankDishes(completados),
    };
}

// KPIs de la vista de Estadísticas. `pedidosTodos` se usa para la historia de cada cliente.
export function computeAnalyticsKPIs(pedidosRango, pedidosTodos) {
    const completados = pedidosRango.filter(p => p.estado === 'listo');
    const totalVendido = completados.reduce((sum, p) => sum + p.monto, 0);
    const cantidadPedidos = completados.length;
    const ticketPromedio = cantidadPedidos > 0 ? totalVendido / cantidadPedidos : 0;

    const topPlatos = rankDishes(completados).slice(0, 5);

    const ventasPorHora = new Array(24).fill(0);
    completados.forEach(p => {
        ventasPorHora[new Date(p.timestamp_creacion).getHours()]++;
    });

    // Los pedidos guardan el nombre del cliente como texto, así que se agrupa por nombre.
    const clientesMap = {};
    pedidosTodos.forEach(p => {
        if (p.estado !== 'listo') return;
        const key = clienteKey(p.cliente.nombre);
        if (!clientesMap[key]) {
            clientesMap[key] = { nombre: p.cliente.nombre, conteo: 0, ultimoPedido: 0 };
        }
        clientesMap[key].conteo++;
        const t = new Date(p.timestamp_creacion).getTime();
        if (t > clientesMap[key].ultimoPedido) clientesMap[key].ultimoPedido = t;
    });

    const pedidosRecurrentes = completados.filter(p => clientesMap[clienteKey(p.cliente.nombre)]?.conteo > 1).length;
    const porcentajeRecurrencia = cantidadPedidos > 0 ? Math.round((pedidosRecurrentes / cantidadPedidos) * 100) : 0;

    const clientes = Object.values(clientesMap);

    const efectivo = completados.filter(p => p.metodo_pago === 'Efectivo').reduce((sum, p) => sum + p.monto, 0);
    const distribucionPago = {
        efectivo,
        tarjeta: totalVendido - efectivo,
        pctEfectivo: totalVendido > 0 ? Math.round((efectivo / totalVendido) * 100) : 0,
    };

    return {
        totalVendido,
        distribucionPago,
        ticketPromedio,
        topPlatos,
        ventasPorHora,
        porcentajeRecurrencia,
        segmentacion: {
            nuevos: clientes.filter(c => c.conteo === 1).sort((a, b) => b.ultimoPedido - a.ultimoPedido),
            fieles: clientes.filter(c => c.conteo >= 3).sort((a, b) => b.conteo - a.conteo),
            total: clientes.length,
        },
    };
}
