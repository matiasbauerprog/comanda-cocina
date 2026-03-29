import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { createPortal } from 'react-dom';
import { Trash2, Edit3, X, Check, Clock, CheckCircle, List, Banknote, CreditCard, MapPin, ChevronDown, Frown, Calendar, AlertTriangle } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import HeaderKpis from './KpiPanel';

function useOrderUrgency(order) {
    const [minutesLeft, setMinutesLeft] = useState(null);
    const hasTime = !!order.horario_entrega;

    useEffect(() => {
        if (!hasTime) return;
        const calcMinutes = () => {
            const now = new Date();
            const [h, m] = order.horario_entrega.split(':').map(Number);
            const target = new Date();
            target.setHours(h, m, 0, 0);
            return Math.round((target - now) / 60000);
        };
        setMinutesLeft(calcMinutes());
        const interval = setInterval(() => setMinutesLeft(calcMinutes()), 30000);
        return () => clearInterval(interval);
    }, [order.horario_entrega, hasTime]);

    const urgency = !hasTime ? 'none'
        : minutesLeft === null ? 'none'
            : minutesLeft <= 0 ? 'late'
                : minutesLeft <= 10 ? 'urgent'
                    : minutesLeft <= 25 ? 'soon'
                        : 'calm';

    const styles = {
        none: { border: 'border-slate-200/60', badge: 'bg-slate-100 text-slate-400' },
        calm: { border: 'border-brand-navy/30', badge: 'bg-brand-navy/10 text-brand-navy' },
        soon: { border: 'border-brand-yellow/60', badge: 'bg-brand-yellow text-amber-900' },
        urgent: { border: 'border-brand-red/50', badge: 'bg-brand-red text-white' },
        late: { border: 'border-brand-red shadow-lg shadow-brand-red/10', badge: 'bg-brand-red text-white' },
    };

    return { urgency, s: styles[urgency], minutesLeft };
}

function DailyOrderCard({ order, editingId, startEdit, deletePedido, editForm, setEditForm, saveEdit, setEditingId, markReady }) {
    const { urgency, s, minutesLeft } = useOrderUrgency(order);
    const countdownText = minutesLeft === null ? null
        : minutesLeft <= 0 ? 'ATRASADO'
            : minutesLeft >= 60 ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`
                : `${minutesLeft} min`;

    return (
        <div className={`glass-card rounded-[1.5rem] p-5 relative transition-all duration-500 hover:shadow-xl hover:shadow-brand-navy/5 group w-full max-w-[440px] border-2 ${s.border}`}>
            {editingId === order.id ? (
                <div className="space-y-3">
                    <input
                        value={editForm.nombre}
                        onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-black text-primary-blue outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white transition-all"
                        placeholder="Cliente"
                    />
                    <input
                        value={editForm.direccion}
                        onChange={e => setEditForm(f => ({ ...f, direccion: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-500 font-medium outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white transition-all"
                        placeholder="Dirección"
                    />
                    <textarea
                        value={editForm.pedido}
                        onChange={e => setEditForm(f => ({ ...f, pedido: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium resize-none outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white transition-all"
                        rows={2}
                        placeholder="Pedido"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pago</label>
                            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                {['Efectivo', 'Tarjeta'].map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setEditForm(f => ({ ...f, metodo_pago: m }))}
                                        className={`flex-1 py-1 rounded-md text-[9px] font-black uppercase transition-all ${editForm.metodo_pago === m
                                            ? (m === 'Tarjeta' ? 'bg-brand-navy text-white' : 'bg-emerald-600 text-white')
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Entrega</label>
                            <input
                                type="time"
                                value={editForm.horario_entrega || ''}
                                onChange={e => setEditForm(f => ({ ...f, horario_entrega: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none focus:bg-white"
                            />
                        </div>
                    </div>
                    <textarea
                        value={editForm.observaciones || ''}
                        onChange={e => setEditForm(f => ({ ...f, observaciones: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[10px] text-slate-500 font-medium resize-none outline-none focus:bg-white"
                        rows={1}
                        placeholder="Observaciones"
                    />
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">$</span>
                            <input
                                type="number"
                                value={editForm.monto}
                                onChange={e => setEditForm(f => ({ ...f, monto: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-6 pr-3 py-2 text-sm text-primary-blue font-display font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="Monto"
                            />
                        </div>
                        <button onClick={() => saveEdit(order.id)} className="p-2 rounded-xl bg-primary-blue text-white hover:bg-black transition-all">
                            <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* 1. Header: Client & Actions */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col pr-8">
                            <h3 className="font-black text-brand-navy uppercase tracking-tighter text-[15px] leading-tight">
                                {order.cliente.nombre}
                            </h3>
                            {order.cliente.direccion && (
                                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wide flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" /> {order.cliente.direccion}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <button onClick={() => startEdit(order)} className="p-1.5 text-slate-300 hover:text-primary-blue hover:bg-slate-50 rounded-lg transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deletePedido(order.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>

                    {/* 2. Sub-Header: Times */}
                    <div className="flex gap-4 mb-3 pb-3 border-b border-slate-50">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-0.5">Inicio</span>
                            <span className="text-[11px] font-bold text-slate-500">
                                {new Date(order.timestamp_creacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                        </div>
                        {order.horario_entrega && (
                            <div className="flex flex-col border-l border-slate-100 pl-4">
                                <span className="text-[9px] font-black text-primary-blue/40 uppercase tracking-widest leading-none mb-0.5 whitespace-nowrap">Entrega</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black text-primary-blue">
                                        {order.horario_entrega}
                                    </span>
                                    {countdownText && (
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full tracking-tighter ${s.badge}`}>
                                            {countdownText}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Body: Order & Notes */}
                    <div className="mb-4 min-h-[40px]">
                        <p className="text-slate-600 text-xs font-bold leading-relaxed break-words">{order.pedido}</p>
                        {order.observaciones && (
                            <div className="mt-2 text-[9px] font-black text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 inline-block uppercase tracking-widest break-words max-w-full">
                                {order.observaciones}
                            </div>
                        )}
                    </div>

                    {/* 4. Footer: Price & Actions */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                        <div className="flex flex-col">
                            <span className={`text-2xl font-display font-black tracking-tighter leading-none ${order.metodo_pago === 'Efectivo' ? 'text-emerald-600' : 'text-brand-navy'}`}>
                                ${order.monto.toLocaleString('es-AR')}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${order.metodo_pago === 'Efectivo' ? 'text-emerald-600' : 'text-brand-navy'}`}>
                                {order.metodo_pago}
                            </span>
                        </div>
                        <button
                            onClick={() => markReady(order.id)}
                            className="bg-brand-red hover:bg-brand-red/90 text-white text-[10px] font-black px-5 py-2.5 rounded-xl shadow-lg shadow-brand-red/20 hover:shadow-xl active:scale-95 transition-all uppercase tracking-widest flex items-center gap-2"
                        >
                            DESPACHAR
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default function DailyOrders() {
    const { pedidosHoy, deletePedido, updatePedido, markReady, dailyFilter, setDailyFilter } = useStore();
    const [tab, setTab] = useState('active');
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [paymentModal, setPaymentModal] = useState(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [activeCalendar, setActiveCalendar] = useState(false);

    // Handle responsive state
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsExpanded(true);
        };
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        setIsExpanded(!mobile);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close calendar on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activeCalendar && !e.target.closest('.calendar-popover') && !e.target.closest('.calendar-trigger')) {
                setActiveCalendar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeCalendar]);

    const formatFilterLabel = (filter) => {
        if (filter === 'dia') return 'HOY';
        if (filter === 'semana') return 'SEM';
        if (filter === 'mes') return 'MES';
        if (/^\d{4}-\d{2}-\d{2}$/.test(filter)) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selected = new Date(filter + 'T00:00:00');
            const diffDays = Math.round((today - selected) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) return 'HOY';
            if (diffDays === 1) return 'AYER';
            const [y, m, d] = filter.split('-');
            return `${d}/${m}`;
        }
        return filter.toUpperCase();
    };

    const toggleExpand = () => {
        if (isMobile) {
            setIsExpanded(!isExpanded);
        }
    };

    // Drag to scroll wrapper
    const scrollContainerRef = useRef(null);
    const [isDraggingScroll, setIsDraggingScroll] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const onScrollMouseDown = (e) => {
        if (!scrollContainerRef.current) return;
        setIsDraggingScroll(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };
    const onScrollMouseLeave = () => setIsDraggingScroll(false);
    const onScrollMouseUp = () => setIsDraggingScroll(false);
    const onScrollMouseMove = (e) => {
        if (!isDraggingScroll || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    // Resizable columns
    const [colWidths, setColWidths] = useState([65, 130, 140, 95, 85]);

    const onResizeStart = useCallback((colIndex, e) => {
        e.stopPropagation();
        const isTouch = e.type.startsWith('touch');
        const startX = isTouch ? e.touches[0].clientX : e.clientX;
        const startWidths = [...colWidths];

        const onMove = (moveEvent) => {
            const currentX = moveEvent.type.startsWith('touch') ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const delta = currentX - startX;
            const newWidths = [...startWidths];
            newWidths[colIndex] = Math.max(30, startWidths[colIndex] + delta);
            setColWidths(newWidths);
        };

        const onEnd = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, [colWidths]);

    const gridTemplate = colWidths.map(w => `${w}px`).join(' ');

    const activeOrders = pedidosHoy
        .filter(p => p.estado !== 'listo')
        .sort((a, b) => {
            const aHas = !!a.horario_entrega;
            const bHas = !!b.horario_entrega;
            if (aHas && !bHas) return -1;
            if (!aHas && bHas) return 1;
            if (aHas && bHas) return a.horario_entrega.localeCompare(b.horario_entrega);
            return 0;
        });
    const historyOrders = pedidosHoy.filter(p => p.estado === 'listo');
    const ordersToDisplay = tab === 'active' ? activeOrders : historyOrders;

    const startEdit = (p) => {
        setEditingId(p.id);
        setEditForm({
            nombre: p.cliente.nombre,
            direccion: p.cliente.direccion,
            pedido: p.pedido,
            observaciones: p.observaciones || '',
            monto: p.monto,
            metodo_pago: p.metodo_pago,
            horario_entrega: p.horario_entrega || '',
        });
    };

    const saveEdit = (id) => {
        updatePedido(id, {
            cliente_nombre: editForm.nombre,
            cliente_direccion: editForm.direccion,
            pedido: editForm.pedido,
            observaciones: editForm.observaciones,
            monto: parseFloat(editForm.monto) || 0,
            metodo_pago: editForm.metodo_pago,
            horario_entrega: editForm.horario_entrega,
        });
        setEditingId(null);
    };

    const totalEfectivo = historyOrders.filter(p => p.metodo_pago === 'Efectivo').reduce((acc, p) => acc + p.monto, 0);
    const totalTarjeta = historyOrders.filter(p => p.metodo_pago !== 'Efectivo').reduce((acc, p) => acc + p.monto, 0);

    const columnHeaders = ['Horario', 'Cliente', 'Dirección', 'Método', 'Monto'];

    return (
        <div className={`bg-white/80 backdrop-blur-xl border border-white/40 flex flex-col shadow-[0_8px_40px_rgba(0,40,85,0.06)] rounded-[2rem] relative px-4 transition-all duration-300 ${isExpanded ? 'pb-4 h-auto' : 'pb-0 h-auto overflow-hidden'}`}>

            {/* Tabs / Header */}
            <div
                className={`flex items-center justify-between px-4 py-4 border-slate-100 bg-white rounded-t-2xl transition-all cursor-pointer lg:cursor-default ${isExpanded ? 'border-b' : ''}`}
                onClick={toggleExpand}
            >
                <div className="flex bg-slate-100 p-1 rounded-2xl ring-1 ring-slate-200/50" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => { setTab('active'); if (isMobile && !isExpanded) setIsExpanded(true); }}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 cursor-pointer ${tab === 'active'
                            ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50 ring-1 ring-slate-100'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <List className="w-3.5 h-3.5" />
                        Comanda
                        {activeOrders.length > 0 && (
                            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-black ${tab === 'active' ? 'bg-brand-navy text-white shadow-md shadow-brand-navy/20' : 'bg-slate-200 text-slate-500'}`}>
                                {activeOrders.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setTab('history'); if (isMobile && !isExpanded) setIsExpanded(true); }}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-300 cursor-pointer ${tab === 'history'
                            ? 'bg-white text-brand-navy shadow-lg shadow-slate-200/50 ring-1 ring-slate-100'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        Total del dia
                    </button>
                </div>

                {/* KPIs */}
                <div className="hidden md:flex flex-1 justify-end items-center mr-4" onClick={e => e.stopPropagation()}>
                    <HeaderKpis />
                </div>

                {/* Mobile Chevron */}
                <div className="lg:hidden text-slate-400">
                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className={`w-full p-4 space-y-4 bg-white rounded-b-2xl border-t border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] ${tab === 'history' ? 'flex flex-col justify-center items-center' : ''}`}>

                    {tab === 'history' ? (
                        ordersToDisplay.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 py-12">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                                    <CheckCircle className="w-8 h-8 text-slate-100" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Historial vacío</p>
                            </div>
                        ) : (
                            <>
                                {/* Centered Calendar Selector inside the container */}
                                <div className="relative flex flex-col items-center mb-6">
                                    <button
                                        onClick={() => setActiveCalendar(!activeCalendar)}
                                        className="flex items-center gap-4 px-6 py-2 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-primary-blue hover:shadow-md transition-all active:scale-95 group calendar-trigger"
                                    >
                                        <Calendar className="w-4 h-4 text-primary-blue" />
                                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest min-w-[60px] text-center">
                                            {formatFilterLabel(dailyFilter)}
                                        </span>
                                        <ChevronDown className={`w-3.5 h-3.5 text-slate-300 group-hover:text-primary-blue transition-transform ${activeCalendar ? 'rotate-180' : 'rotate-0'}`} />
                                    </button>

                                    {activeCalendar && createPortal(
                                        <div
                                            className="fixed z-[120] calendar-popover"
                                            style={{
                                                top: (document.querySelector('.calendar-trigger')?.getBoundingClientRect().bottom || 0) + 12,
                                                left: (document.querySelector('.calendar-trigger')?.getBoundingClientRect().left || 0) - 130
                                            }}
                                        >
                                            <CalendarPicker
                                                selectedDate={dailyFilter === 'dia' ? new Date().toISOString().split('T')[0] : dailyFilter}
                                                onSelect={(date) => { setDailyFilter(date); setActiveCalendar(false); }}
                                                onClose={() => setActiveCalendar(false)}
                                            />
                                        </div>,
                                        document.body
                                    )}
                                </div>

                                {/* Table View (All Breakpoints) */}
                                <div
                                    ref={scrollContainerRef}
                                    className={`w-full overflow-x-auto rounded-xl border border-slate-100 pb-2 custom-scrollbar ${isDraggingScroll ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
                                    onMouseDown={onScrollMouseDown}
                                    onMouseLeave={onScrollMouseLeave}
                                    onMouseUp={onScrollMouseUp}
                                    onMouseMove={onScrollMouseMove}
                                >
                                    <div style={{ minWidth: colWidths.reduce((a, b) => a + b, 0) + 'px' }}>
                                        {/* Table Header */}
                                        <div className="bg-slate-50/50 border-b border-slate-100" style={{ display: 'grid', gridTemplateColumns: gridTemplate }}>
                                            {columnHeaders.map((header, idx) => (
                                                <div key={header} className="relative px-2 py-3 flex items-center justify-center">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest select-none whitespace-nowrap">{header}</span>
                                                    {idx < columnHeaders.length - 1 && (
                                                        <div
                                                            onMouseDown={(e) => onResizeStart(idx, e)}
                                                            onTouchStart={(e) => onResizeStart(idx, e)}
                                                            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary-blue/20 transition-colors z-10"
                                                            style={{ transform: 'translateX(50%)' }}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {/* Table Rows */}
                                        {ordersToDisplay.map((p, i) => {
                                            const created = new Date(p.timestamp_creacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
                                            const timeDisplay = p.horario_entrega ? (
                                                <div className="flex flex-col items-center leading-tight">
                                                    <span className="font-black text-slate-700">{p.horario_entrega}</span>
                                                    <span className="text-[9px] font-bold text-slate-400">In: {created}</span>
                                                </div>
                                            ) : (
                                                <span className="font-black text-slate-400">{created}</span>
                                            );

                                            return (
                                                <div key={p.id} className={`${i < ordersToDisplay.length - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50/80 transition-all duration-300`} style={{ display: 'grid', gridTemplateColumns: gridTemplate, alignItems: 'center' }}>
                                                    <div className="px-2 py-3 flex justify-center text-[11px] font-black text-slate-400 text-center">
                                                        {timeDisplay}
                                                    </div>
                                                    <span className="font-black text-brand-navy text-xs px-2 py-3 truncate text-center uppercase tracking-tight">{p.cliente.nombre}</span>
                                                    <span className="text-[10px] text-slate-400 px-2 py-3 truncate text-center">
                                                        {p.cliente.direccion || '—'}
                                                    </span>
                                                    <div className="flex justify-center px-2 py-3">
                                                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest ring-1 ${p.metodo_pago === 'Efectivo' ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : 'bg-blue-50 text-brand-navy ring-blue-100'}`}>
                                                            {p.metodo_pago}
                                                        </span>
                                                    </div>
                                                    <span className={`text-sm font-display font-black text-center px-2 py-3 whitespace-nowrap ${p.metodo_pago === 'Efectivo' ? 'text-emerald-600' : 'text-brand-navy'}`}>${p.monto.toLocaleString('es-AR')}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Summary Footer */}
                                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-end sm:items-center justify-end gap-4 sm:gap-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ordersToDisplay.length} pedidos</span>
                                        <span className="text-2xl font-display font-black text-primary-blue tracking-tighter">
                                            ${ordersToDisplay.reduce((sum, p) => sum + p.monto, 0).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                    <div className="flex flex-row sm:flex-col gap-4 sm:gap-1 pl-0 sm:pl-6 border-l-0 sm:border-l border-slate-100 shrink-0 w-full sm:w-auto justify-end">
                                        <span className="text-[10px] font-black text-emerald-600 cursor-pointer hover:underline" onClick={() => setPaymentModal('Efectivo')}>
                                            EFECTIVO ${totalEfectivo.toLocaleString('es-AR')}
                                        </span>
                                        <span className="text-[10px] font-black text-brand-navy cursor-pointer hover:underline" onClick={() => setPaymentModal('Tarjeta')}>
                                            TARJETA ${totalTarjeta.toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )
                    ) : (
                        ordersToDisplay.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 py-12">
                                <div className="mb-4">
                                    <Frown className="w-12 h-12 text-slate-200/50" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No hay pedidos pendientes</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap justify-center gap-4">
                                {ordersToDisplay.map(p => (
                                    <DailyOrderCard
                                        key={p.id}
                                        order={p}
                                        editingId={editingId}
                                        startEdit={startEdit}
                                        deletePedido={deletePedido}
                                        editForm={editForm}
                                        setEditForm={setEditForm}
                                        saveEdit={saveEdit}
                                        setEditingId={setEditingId}
                                        markReady={markReady}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Payment Detail Modal */}
            {paymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setPaymentModal(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden animate-card-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                            <h2 className={`text-sm font-display font-bold uppercase tracking-wide flex items-center gap-2 ${paymentModal === 'Efectivo' ? 'text-emerald-700' : 'text-brand-navy'}`}>
                                {paymentModal === 'Efectivo' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                Ventas en {paymentModal}
                            </h2>
                            <button onClick={() => setPaymentModal(null)} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-3 space-y-2">
                            {historyOrders.filter(p => p.metodo_pago === paymentModal).length === 0 ? (
                                <p className="text-gray-400 text-center py-6 italic text-xs">No hay ventas registradas</p>
                            ) : (
                                historyOrders.filter(p => p.metodo_pago === paymentModal).map(p => (
                                    <div key={p.id} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 flex items-center justify-between">
                                        <div className="flex-1 min-w-0 mr-2">
                                            <span className="block font-bold text-gray-900 text-xs uppercase truncate">{p.cliente.nombre}</span>
                                            <span className="text-[10px] text-gray-500 line-clamp-1">{p.pedido}</span>
                                        </div>
                                        <span className={`text-sm font-display font-bold shrink-0 ${paymentModal === 'Efectivo' ? 'text-emerald-600' : 'text-brand-navy'}`}>
                                            ${p.monto.toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total {paymentModal}</span>
                            <p className={`text-xl font-display font-bold ${paymentModal === 'Efectivo' ? 'text-emerald-700' : 'text-brand-navy'}`}>
                                ${historyOrders.filter(p => p.metodo_pago === paymentModal).reduce((sum, p) => sum + p.monto, 0).toLocaleString('es-AR')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
