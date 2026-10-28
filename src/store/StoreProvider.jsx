import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { filterOrdersByDateRange, filterNeedsHistory, getDateRange } from '../lib/dates';
import { sortByDeliveryTime, topPlatos } from '../lib/pedidos';
import { toClienteRow } from '../lib/clientes';
import { StoreContext } from './useStore';
import { computeKPIs, computeAnalyticsKPIs } from './kpis';

const PAGE_SIZE = 1000; // Supabase devuelve como máximo 1000 filas por request

function parsePedidoRecord(row) {
    return {
        ...row,
        cliente: {
            nombre: row.cliente_nombre,
            direccion: row.cliente_direccion
        }
    };
}

// Trae todas las filas de una tabla (o las que pasen `applyFilter`), página por página.
async function fetchAll(table, orderColumn, applyFilter = (query) => query, columns = '*') {
    const rows = [];
    for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await applyFilter(supabase.from(table).select(columns))
            .order(orderColumn, { ascending: false })
            .order('id', { ascending: true })
            .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        rows.push(...data);
        if (data.length < PAGE_SIZE) return rows;
    }
}

// Carga inicial liviana: los pedidos sin despachar (de cualquier día) y los de hoy.
// El resto del historial se trae con ensureHistory cuando una vista lo necesita.
function recentPedidos(query) {
    const since = getDateRange('dia').since.toISOString();
    return query.or(`estado.neq.listo,timestamp_creacion.gte."${since}"`);
}

// Para los botones de "más pedidos": solo el texto de los pedidos despachados del último mes.
const MAS_PEDIDOS_DIAS = 30;
function fetchPedidosRecientes() {
    const since = new Date(Date.now() - MAS_PEDIDOS_DIAS * 24 * 60 * 60 * 1000).toISOString();
    return fetchAll('pedidos', 'timestamp_creacion', q => q.eq('estado', 'listo').gte('timestamp_creacion', since), 'id, pedido, timestamp_creacion');
}

function applyChange(setter, payload, parse = (r) => r) {
    if (payload.eventType === 'INSERT') {
        const record = parse(payload.new);
        setter(prev => prev.some(p => p.id === record.id) ? prev : [record, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
        const record = parse(payload.new);
        setter(prev => prev.map(p => p.id === record.id ? record : p));
    } else if (payload.eventType === 'DELETE') {
        setter(prev => prev.filter(p => p.id !== payload.old.id));
    }
}

// Ejecuta una escritura en Supabase. Devuelve true si salió bien; si no, avisa al usuario.
async function runMutation(label, request) {
    const { error } = await request;
    if (error) {
        console.error(`Error al ${label}:`, error);
        alert(`Error al ${label}: ${error.message}`);
        return false;
    }
    return true;
}

export function StoreProvider({ children, active = false }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [pedidos, setPedidos] = useState([]);
    const [platos, setPlatos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [pedidosRecientes, setPedidosRecientes] = useState([]);
    const [reloadKey, setReloadKey] = useState(0);
    // 'idle' | 'loading' | 'loaded'. historyWantedRef sigue pidiendo el historial
    // completo si el realtime se reconecta; sessionRef descarta respuestas de una
    // sesión que ya se cerró.
    const [historyStatus, setHistoryStatus] = useState('idle');
    const historyWantedRef = useRef(false);
    const sessionRef = useRef(0);

    useEffect(() => {
        sessionRef.current++;
        if (!active) return;

        let cancelled = false;
        const fetchData = async () => {
            try {
                const [pedidosRows, platosRows, clientesRows] = await Promise.all([
                    fetchAll('pedidos', 'timestamp_creacion', historyWantedRef.current ? undefined : recentPedidos),
                    fetchAll('platos', 'created_at'),
                    fetchAll('clientes', 'created_at'),
                ]);
                if (cancelled) return;
                setPedidos(pedidosRows.map(parsePedidoRecord));
                setPlatos(platosRows);
                setClientes(clientesRows);
                setLoadError(null);
                setIsInitialized(true);
            } catch (err) {
                console.error('Error cargando datos:', err);
                if (!cancelled) setLoadError(err.message || String(err));
            }
        };

        fetchData();
        // No bloquea la carga: si falla, simplemente no se muestran los más pedidos
        fetchPedidosRecientes()
            .then(rows => { if (!cancelled) setPedidosRecientes(rows); })
            .catch(err => console.error('Error cargando los más pedidos:', err));

        // Si el realtime se reconecta, se pierden los cambios ocurridos mientras estuvo
        // caído, así que se vuelven a traer los datos.
        let subscribedOnce = false;
        const channel = supabase.channel('gaspacho-db')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, payload => applyChange(setPedidos, payload, parsePedidoRecord))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'platos' }, payload => applyChange(setPlatos, payload))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, payload => applyChange(setClientes, payload))
            .subscribe(status => {
                if (status !== 'SUBSCRIBED') return;
                if (subscribedOnce) fetchData();
                subscribedOnce = true;
            });

        return () => {
            cancelled = true;
            historyWantedRef.current = false;
            setHistoryStatus('idle');
            supabase.removeChannel(channel);
            // Al cerrar sesión no quedan datos del usuario anterior en memoria
            setIsInitialized(false);
            setPedidos([]);
            setPlatos([]);
            setClientes([]);
            setPedidosRecientes([]);
        };
    }, [active, reloadKey]);

    const ensureHistory = useCallback(async () => {
        if (historyWantedRef.current) return;
        historyWantedRef.current = true;
        const session = sessionRef.current;
        setHistoryStatus('loading');
        try {
            const rows = await fetchAll('pedidos', 'timestamp_creacion');
            if (session !== sessionRef.current) return;
            setPedidos(rows.map(parsePedidoRecord));
            setHistoryStatus('loaded');
        } catch (err) {
            if (session !== sessionRef.current) return;
            console.error('Error cargando el historial:', err);
            historyWantedRef.current = false;
            setHistoryStatus('error');
        }
    }, []);

    const reload = useCallback(() => {
        setLoadError(null);
        setReloadKey(k => k + 1);
    }, []);

    // === Platos CRUD ===
    const addPlato = useCallback((data) =>
        runMutation('agregar plato', supabase.from('platos').insert([{ nombre: data.nombre, monto: parseFloat(data.monto) || 0 }])), []);
    const updatePlato = useCallback((id, updates) =>
        runMutation('actualizar plato', supabase.from('platos').update({ ...updates, monto: parseFloat(updates.monto) || 0 }).eq('id', id)), []);
    const deletePlato = useCallback((id) =>
        runMutation('eliminar plato', supabase.from('platos').delete().eq('id', id)), []);

    // === Clientes CRUD ===
    const addCliente = useCallback((data) =>
        runMutation('agregar cliente', supabase.from('clientes').insert([toClienteRow(data)])), []);
    const updateCliente = useCallback((id, data) =>
        runMutation('actualizar cliente', supabase.from('clientes').update(toClienteRow(data)).eq('id', id)), []);
    const deleteCliente = useCallback((id) =>
        runMutation('eliminar cliente', supabase.from('clientes').delete().eq('id', id)), []);
    // Une varios clientes en uno (ver supabase/clientes-direcciones.sql). Es una sola
    // transacción en la base; realtime trae los cambios de clientes y pedidos.
    const unirClientes = useCallback(({ keepId, deleteIds, nombre, direcciones, nombresViejos }) => {
        const row = toClienteRow({ nombre, direcciones });
        return runMutation('unir clientes', supabase.rpc('unir_clientes', {
            p_keep_id: String(keepId),
            p_nombre: row.nombre,
            p_direcciones: row.direcciones,
            p_delete_ids: deleteIds.map(String),
            p_nombres_viejos: nombresViejos,
        }));
    }, []);

    // === Pedidos CRUD ===
    const addPedido = useCallback((data) =>
        runMutation('agregar pedido', supabase.from('pedidos').insert([{
            cliente_nombre: data.nombre,
            cliente_direccion: data.direccion,
            pedido: data.pedido,
            horario_entrega: data.horario_entrega,
            metodo_pago: data.metodo_pago,
            observaciones: data.observaciones || '',
            estado: 'pendiente',
            monto: parseFloat(data.monto) || 0,
        }])), []);

    const updatePedido = useCallback((id, updates) =>
        runMutation('actualizar pedido', supabase.from('pedidos').update(updates).eq('id', id)), []);

    const deletePedido = useCallback((id) =>
        runMutation('eliminar pedido', supabase.from('pedidos').delete().eq('id', id)), []);

    const markReady = useCallback((id) =>
        runMutation('despachar pedido', supabase.from('pedidos').update({
            estado: 'listo',
            timestamp_finalizacion: new Date().toISOString()
        }).eq('id', id)), []);

    const masPedidos = useMemo(() => topPlatos(pedidosRecientes, platos), [pedidosRecientes, platos]);

    // Pedidos sin despachar, de cualquier día, ordenados por horario de entrega.
    const pedidosActivos = useMemo(() => sortByDeliveryTime(pedidos.filter(p => p.estado !== 'listo')), [pedidos]);

    // === Filtros independientes ===

    // Historial del día (pestaña "Total del día")
    const [dailyFilter, setDailyFilterState] = useState('dia');
    const setDailyFilter = useCallback((f) => { setDailyFilterState(f); if (filterNeedsHistory(f)) ensureHistory(); }, [ensureHistory]);
    const pedidosHoy = useMemo(() => filterOrdersByDateRange(pedidos, dailyFilter), [pedidos, dailyFilter]);

    // 1. Ventas (Total Vendido y modal de ventas)
    const [salesFilter, setSalesFilterState] = useState('dia');
    const setSalesFilter = useCallback((f) => { setSalesFilterState(f); if (filterNeedsHistory(f)) ensureHistory(); }, [ensureHistory]);
    const salesOrders = useMemo(() => filterOrdersByDateRange(pedidos, salesFilter), [pedidos, salesFilter]);
    const salesKPIs = useMemo(() => computeKPIs(salesOrders), [salesOrders]);

    // 2. Ranking (Pedidos Despachados y modal de ranking)
    const [rankingFilter, setRankingFilterState] = useState('dia');
    const setRankingFilter = useCallback((f) => { setRankingFilterState(f); if (filterNeedsHistory(f)) ensureHistory(); }, [ensureHistory]);
    const rankingOrders = useMemo(() => filterOrdersByDateRange(pedidos, rankingFilter), [pedidos, rankingFilter]);
    const rankingKPIs = useMemo(() => computeKPIs(rankingOrders), [rankingOrders]);

    // 3. Estadísticas
    const [analyticsFilter, setAnalyticsFilter] = useState('mes');
    const analyticsOrders = useMemo(() => filterOrdersByDateRange(pedidos, analyticsFilter), [pedidos, analyticsFilter]);
    const analyticsKPIs = useMemo(() => computeAnalyticsKPIs(analyticsOrders, pedidos), [analyticsOrders, pedidos]);

    const value = {
        isInitialized,
        loadError,
        reload,
        historyStatus,
        ensureHistory,

        pedidos,
        pedidosActivos,
        addPedido,
        updatePedido,
        deletePedido,
        markReady,

        // Historial del día
        pedidosHoy,
        dailyFilter,
        setDailyFilter,

        // Ventas
        salesKPIs,
        salesOrders,
        salesFilter,
        setSalesFilter,

        // Ranking
        rankingKPIs,
        rankingOrders,
        rankingFilter,
        setRankingFilter,

        // Estadísticas
        analyticsKPIs,
        analyticsFilter,
        setAnalyticsFilter,

        platos, addPlato, updatePlato, deletePlato, masPedidos,
        clientes, addCliente, updateCliente, deleteCliente, unirClientes,
    };

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
