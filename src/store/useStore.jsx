import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

function parsePedidoRecord(row) {
    return {
        ...row,
        cliente: {
            nombre: row.cliente_nombre,
            direccion: row.cliente_direccion
        }
    };
}

// === Date range helpers ===
function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function startOfWeek(date) {
    const d = startOfDay(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    d.setDate(diff);
    return d;
}

function startOfMonth(date) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}

function startOfYear(date) {
    const d = new Date(date);
    d.setMonth(0, 1);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getDateRange(range) {
    const now = new Date();
    // Check if range is a specific date (YYYY-MM-DD)
    if (range && /^\d{4}-\d{2}-\d{2}$/.test(range)) {
        const d = new Date(range + 'T00:00:00');
        return d;
    }

    switch (range) {
        case 'dia': return startOfDay(now);
        case 'semana': return startOfWeek(now);
        case 'mes': return startOfMonth(now);
        case 'año': return startOfYear(now);
        default: return startOfDay(now);
    }
}

// EXPLICACIÓN: Abstraemos la lógica repetitiva de filtrar pedidos por fecha.
// Esto elimina más de 50 líneas de código duplicado, previniendo errores a futuro (DRY).
function filterOrdersByDateRange(pedidos, filterType) {
    const since = getDateRange(filterType);
    const isSpecificDate = /^\d{4}-\d{2}-\d{2}$/.test(filterType);

    if (isSpecificDate) {
        const endOfDay = new Date(since);
        endOfDay.setHours(23, 59, 59, 999);
        return pedidos.filter(p => {
            const d = new Date(p.timestamp_creacion);
            return d >= since && d <= endOfDay;
        });
    }

    return pedidos.filter(p => new Date(p.timestamp_creacion) >= since);
}

function computeKPIs(pedidos) {
    const completados = pedidos.filter(p => p.estado === 'listo');
    const totalVendido = completados.reduce((sum, p) => sum + p.monto, 0);
    const cantidadPedidos = pedidos.length;
    const pedidosCompletados = completados.length;
    const ticketPromedio = pedidosCompletados > 0 ? totalVendido / pedidosCompletados : 0;

    // Payment distribution (Revenue)
    const distribucionPago = completados.reduce((acc, p) => {
        acc[p.metodo_pago] = (acc[p.metodo_pago] || 0) + p.monto;
        return acc;
    }, {});

    // Item counts
    const itemCounts = {};
    pedidos.forEach(p => {
        const items = p.pedido.split(',').map(i => i.trim().toLowerCase());
        items.forEach(item => {
            if (item) itemCounts[item] = (itemCounts[item] || 0) + 1;
        });
    });
    const topItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

    // Orders by day (for chart)
    const porDia = {};
    pedidos.forEach(p => {
        const day = new Date(p.timestamp_creacion).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });
        porDia[day] = (porDia[day] || 0) + 1;
    });

    // Revenue by day
    const revenuePorDia = {};
    completados.forEach(p => {
        const day = new Date(p.timestamp_finalizacion || p.timestamp_creacion).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });
        revenuePorDia[day] = (revenuePorDia[day] || 0) + p.monto;
    });

    return {
        totalVendido,
        cantidadPedidos,
        pedidosCompletados,
        ticketPromedio,
        distribucionPago,
        topItems,
        porDia,
        revenuePorDia,
    };
}

function computeAnalyticsKPIs(pedidosRango, pedidosTodos) {
    const completados = pedidosRango.filter(p => p.estado === 'listo');

    let totalVendido = 0;

    completados.forEach(p => {
        totalVendido += p.monto;
    });

    const cantidadPedidos = completados.length;
    const ticketPromedio = cantidadPedidos > 0 ? (totalVendido / cantidadPedidos) : 0;

    const itemCounts = {};
    completados.forEach(p => {
        const items = p.pedido.split(',').map(i => i.trim().toLowerCase());
        items.forEach(item => {
            if (item) itemCounts[item] = (itemCounts[item] || 0) + 1;
        });
    });

    const topPlatosRentables = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({
            name,
            count,
            margenEstimado: count * (ticketPromedio / 2) * 0.6 // Mock margin 60% of half-ticket
        }));

    const ventasPorHora = new Array(24).fill(0);
    completados.forEach(p => {
        const hour = new Date(p.timestamp_creacion).getHours();
        ventasPorHora[hour]++;
    });

    const clientesMap = {};
    pedidosTodos.forEach(p => {
        if (p.estado !== 'listo') return;
        const nombre = p.cliente.nombre.toLowerCase().trim();
        if (!clientesMap[nombre]) {
            clientesMap[nombre] = { nombre: p.cliente.nombre, conteo: 0, ultimoPedido: 0 };
        }
        clientesMap[nombre].conteo++;
        const t = new Date(p.timestamp_creacion).getTime();
        if (t > clientesMap[nombre].ultimoPedido) {
            clientesMap[nombre].ultimoPedido = t;
        }
    });

    const nuevos = [];
    const fieles = [];

    let pedidosRecurrentes = 0;
    completados.forEach(p => {
        const nombre = p.cliente.nombre.toLowerCase().trim();
        if (clientesMap[nombre] && clientesMap[nombre].conteo > 1) {
            pedidosRecurrentes++;
        }
    });

    const porcentajeRecurrencia = cantidadPedidos > 0 ? Math.round((pedidosRecurrentes / cantidadPedidos) * 100) : 0;

    Object.values(clientesMap).forEach(c => {
        if (c.conteo === 1) nuevos.push(c);
        else if (c.conteo >= 3) fieles.push(c);
    });

    return {
        totalVendido,
        ticketPromedio,
        topPlatosRentables,
        ventasPorHora,
        porcentajeRecurrencia,
        segmentacion: {
            nuevos: nuevos.sort((a, b) => b.ultimoPedido - a.ultimoPedido),
            fieles: fieles.sort((a, b) => b.conteo - a.conteo),
            total: Object.keys(clientesMap).length
        }
    };
}

const StoreContext = createContext(null);

export function StoreProvider({ children, active = false }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [pedidos, setPedidos] = useState([]);
    const [platos, setPlatos] = useState([]);
    const [clientes, setClientes] = useState([]);

    useEffect(() => {
        if (!active) {
            setIsInitialized(false);
            return;
        }

        const fetchInitialData = async () => {
            const [pedidosRes, platosRes, clientesRes] = await Promise.all([
                supabase.from('pedidos').select('*').order('timestamp_creacion', { ascending: false }),
                supabase.from('platos').select('*').order('created_at', { ascending: false }),
                supabase.from('clientes').select('*').order('created_at', { ascending: false })
            ]);

            if (pedidosRes.data) {
                setPedidos(pedidosRes.data.map(parsePedidoRecord));
            }
            if (platosRes.data) setPlatos(platosRes.data);
            if (clientesRes.data) setClientes(clientesRes.data);

            setIsInitialized(true);
        };

        fetchInitialData();

        // Subscriptions
        const pedidosSub = supabase.channel('pedidos-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, payload => {
                const record = parsePedidoRecord(payload.new);
                if (payload.eventType === 'INSERT') {
                    setPedidos(prev => prev.some(p => p.id === record.id) ? prev : [record, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setPedidos(prev => prev.map(p => p.id === record.id ? record : p));
                } else if (payload.eventType === 'DELETE') {
                    setPedidos(prev => prev.filter(p => p.id !== payload.old.id));
                }
            }).subscribe();

        const platosSub = supabase.channel('platos-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'platos' }, payload => {
                if (payload.eventType === 'INSERT') setPlatos(prev => prev.some(p => p.id === payload.new.id) ? prev : [payload.new, ...prev]);
                else if (payload.eventType === 'UPDATE') setPlatos(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
                else if (payload.eventType === 'DELETE') setPlatos(prev => prev.filter(p => p.id !== payload.old.id));
            }).subscribe();

        const clientesSub = supabase.channel('clientes-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, payload => {
                if (payload.eventType === 'INSERT') setClientes(prev => prev.some(p => p.id === payload.new.id) ? prev : [payload.new, ...prev]);
                else if (payload.eventType === 'UPDATE') setClientes(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
                else if (payload.eventType === 'DELETE') setClientes(prev => prev.filter(p => p.id !== payload.old.id));
            }).subscribe();

        return () => {
            supabase.removeChannel(pedidosSub);
            supabase.removeChannel(platosSub);
            supabase.removeChannel(clientesSub);
        };
    }, [active]);

    // === Platos CRUD ===
    const addPlato = useCallback(async (data) => {
        try {
            const { error } = await supabase.from('platos').insert([{ nombre: data.nombre, monto: parseFloat(data.monto) || 0 }]);
            if (error) throw error;
        } catch (err) {
            console.error("Error adding plato:", err);
            alert("Error al agregar plato: " + err.message);
        }
    }, []);
    const updatePlato = useCallback(async (id, updates) => {
        try {
            const { error } = await supabase.from('platos').update(updates).eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error("Error updating plato:", err);
            alert("Error al actualizar plato: " + err.message);
        }
    }, []);
    const deletePlato = useCallback(async (id) => {
        try {
            const { error } = await supabase.from('platos').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error("Error deleting plato:", err);
            alert("Error al eliminar plato: " + err.message);
        }
    }, []);

    // === Clientes CRUD ===
    const addCliente = useCallback(async (data) => {
        try {
            const { error } = await supabase.from('clientes').insert([{ nombre: data.nombre, direccion: data.direccion || '' }]);
            if (error) throw error;
        } catch (err) {
            console.error("Error adding cliente:", err);
            alert("Error al agregar cliente: " + err.message);
        }
    }, []);
    const updateCliente = useCallback(async (id, updates) => {
        try {
            const { error } = await supabase.from('clientes').update(updates).eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error("Error updating cliente:", err);
            alert("Error al actualizar cliente: " + err.message);
        }
    }, []);
    const deleteCliente = useCallback(async (id) => {
        try {
            const { error } = await supabase.from('clientes').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error("Error deleting cliente:", err);
            alert("Error al eliminar cliente: " + err.message);
        }
    }, []);

    // === Pedidos CRUD ===
    const addPedido = useCallback(async (data) => {
        try {
            const newPedidoRecord = {
                cliente_nombre: data.nombre,
                cliente_direccion: data.direccion,
                pedido: data.pedido,
                horario_entrega: data.horario_entrega,
                metodo_pago: data.metodo_pago,
                observaciones: data.observaciones || '',
                estado: 'pendiente',
                monto: parseFloat(data.monto) || 0,
            };
            const { error } = await supabase.from('pedidos').insert([newPedidoRecord]);
            if (error) throw error;
        } catch (err) {
            console.error("Error adding pedido:", err);
            alert("Error al agregar pedido: " + err.message);
        }
    }, []);

    const updatePedido = useCallback(async (id, updates) => {
        await supabase.from('pedidos').update(updates).eq('id', id);
    }, []);

    const deletePedido = useCallback(async (id) => {
        await supabase.from('pedidos').delete().eq('id', id);
    }, []);

    const markReady = useCallback(async (id) => {
        await supabase.from('pedidos').update({
            estado: 'listo',
            timestamp_finalizacion: new Date().toISOString()
        }).eq('id', id);
    }, []);

    const markEnProceso = useCallback(async (id) => {
        await supabase.from('pedidos').update({ estado: 'en_proceso' }).eq('id', id);
    }, []);

    const [dailyFilter, setDailyFilter] = useState('dia');
    const pedidosHoy = useMemo(() => filterOrdersByDateRange(pedidos, dailyFilter), [pedidos, dailyFilter]);

    // Active orders (pendiente + en_proceso)
    const pedidosActivos = useMemo(() => pedidos.filter(p => p.estado !== 'listo'), [pedidos]);

    // === Independent Filters ===

    // 1. Sales Filter (Total Vendido & Sales Modal)
    const [salesFilter, setSalesFilter] = useState('dia');
    // EXPLICACIÓN: Reutilizamos la función de filtrado, dejando el código mucho más limpio.
    const salesOrders = useMemo(() => filterOrdersByDateRange(pedidos, salesFilter), [pedidos, salesFilter]);
    const salesKPIs = useMemo(() => computeKPIs(salesOrders), [salesOrders]);

    // 2. Ranking Filter (Pedidos Despachados & Ranking Modal)
    const [rankingFilter, setRankingFilter] = useState('dia');
    const rankingOrders = useMemo(() => filterOrdersByDateRange(pedidos, rankingFilter), [pedidos, rankingFilter]);
    const rankingKPIs = useMemo(() => computeKPIs(rankingOrders), [rankingOrders]);

    // 3. Analytics Filter
    const [analyticsFilter, setAnalyticsFilter] = useState('mes'); // Default to month for better data
    const analyticsOrders = useMemo(() => filterOrdersByDateRange(pedidos, analyticsFilter), [pedidos, analyticsFilter]);
    const analyticsKPIs = useMemo(() => computeAnalyticsKPIs(analyticsOrders, pedidos), [analyticsOrders, pedidos]);

    // Legacy helper (optional, can keep for generic usage if needed)
    const getKPIsForRange = useCallback((range) => {
        const since = getDateRange(range);
        const filtered = pedidos.filter(p => new Date(p.timestamp_creacion) >= since);
        return computeKPIs(filtered);
    }, [pedidos]);

    const value = {
        isInitialized,
        pedidos,
        pedidosActivos,
        addPedido,
        updatePedido,
        deletePedido,
        markReady,
        markEnProceso,
        getKPIsForRange,

        // Daily/General Orders
        pedidosHoy,
        dailyFilter,
        setDailyFilter,

        // Sales Data
        salesKPIs,
        salesOrders,
        salesFilter,
        setSalesFilter,

        // Ranking Data
        rankingKPIs,
        rankingOrders,
        rankingFilter,
        setRankingFilter,

        // Analytics Data
        analyticsKPIs,
        analyticsFilter,
        setAnalyticsFilter,

        // Platos DB
        platos, addPlato, updatePlato, deletePlato,

        // Clientes DB
        clientes, addCliente, updateCliente, deleteCliente,
    };

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error('useStore must be inside StoreProvider');
    return ctx;
}
