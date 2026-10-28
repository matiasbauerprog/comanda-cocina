import { useState, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { X, Clock, CheckCircle, List, Banknote, CreditCard, ChevronDown, Frown, Calendar } from 'lucide-react';
import CalendarPopover from './CalendarPopover';
import DailyOrderCard from './DailyOrderCard';
import HeaderKpis from './KpiPanel';
import { useIsMobile, isMobileViewport } from '../hooks/useIsMobile';
import { filterToCalendarDate, formatFilterLabel, formatTime } from '../lib/dates';

const COLUMN_HEADERS = ['Horario', 'Cliente', 'Dirección', 'Método', 'Monto'];

function sumMonto(orders) {
    return orders.reduce((sum, p) => sum + p.monto, 0);
}

function PaymentModal({ metodo, orders, onClose }) {
    const filtered = orders.filter(p => p.metodo_pago === metodo);
    const isEfectivo = metodo === 'Efectivo';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden animate-card-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <h2 className={`text-sm font-display font-bold uppercase tracking-wide flex items-center gap-2 ${isEfectivo ? 'text-emerald-700' : 'text-brand-navy'}`}>
                        {isEfectivo ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                        Ventas en {metodo}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="overflow-y-auto p-3 space-y-2">
                    {filtered.length === 0 ? (
                        <p className="text-gray-400 text-center py-6 italic text-xs">No hay ventas registradas</p>
                    ) : (
                        filtered.map(p => (
                            <div key={p.id} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 flex items-center justify-between">
                                <div className="flex-1 min-w-0 mr-2">
                                    <span className="block font-bold text-gray-900 text-xs uppercase truncate">{p.cliente.nombre}</span>
                                    <span className="text-[10px] text-gray-500 line-clamp-1">{p.pedido}</span>
                                </div>
                                <span className={`text-sm font-display font-bold shrink-0 ${isEfectivo ? 'text-emerald-600' : 'text-brand-navy'}`}>
                                    ${p.monto.toLocaleString('es-AR')}
                                </span>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total {metodo}</span>
                    <p className={`text-xl font-display font-bold ${isEfectivo ? 'text-emerald-700' : 'text-brand-navy'}`}>
                        ${sumMonto(filtered).toLocaleString('es-AR')}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function DailyOrders() {
    const { pedidosActivos, pedidosHoy, deletePedido, updatePedido, markReady, dailyFilter, setDailyFilter } = useStore();
    const [tab, setTab] = useState('active');
    const [paymentModal, setPaymentModal] = useState(null);
    const isMobile = useIsMobile();
    const [isExpandedMobile, setIsExpandedMobile] = useState(() => !isMobileViewport());
    // En desktop el panel siempre está expandido
    const isExpanded = !isMobile || isExpandedMobile;

    const toggleExpand = () => {
        if (isMobile) setIsExpandedMobile(!isExpandedMobile);
    };

    const selectTab = (next) => {
        setTab(next);
        if (isMobile) setIsExpandedMobile(true);
    };

    // Drag to scroll wrapper
    const scrollContainerRef = useRef(null);
    const dragRef = useRef(null); // { startX, scrollLeft } mientras se arrastra
    const [isDraggingScroll, setIsDraggingScroll] = useState(false);

    const onScrollMouseDown = (e) => {
        const el = scrollContainerRef.current;
        if (!el) return;
        dragRef.current = { startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
        setIsDraggingScroll(true);
    };
    const stopDragging = () => {
        dragRef.current = null;
        setIsDraggingScroll(false);
    };
    const onScrollMouseMove = (e) => {
        const el = scrollContainerRef.current;
        if (!dragRef.current || !el) return;
        e.preventDefault();
        const walk = (e.pageX - el.offsetLeft - dragRef.current.startX) * 1.5;
        el.scrollLeft = dragRef.current.scrollLeft - walk;
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
            const newWidths = [...startWidths];
            newWidths[colIndex] = Math.max(30, startWidths[colIndex] + currentX - startX);
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

    // La comanda muestra todos los pendientes, sin importar el día en que se cargaron.
    const activeOrders = pedidosActivos;
    const historyOrders = pedidosHoy.filter(p => p.estado === 'listo');

    const totalEfectivo = sumMonto(historyOrders.filter(p => p.metodo_pago === 'Efectivo'));
    const totalTarjeta = sumMonto(historyOrders.filter(p => p.metodo_pago !== 'Efectivo'));

    return (
        <div className={`bg-white/80 backdrop-blur-xl border border-white/40 flex flex-col shadow-[0_8px_40px_rgba(0,40,85,0.06)] rounded-[2rem] relative px-4 transition-all duration-300 ${isExpanded ? 'pb-4 h-auto' : 'pb-0 h-auto overflow-hidden'}`}>

            {/* Tabs / Header */}
            <div
                className={`flex items-center justify-between px-4 py-4 border-slate-100 bg-white rounded-t-2xl transition-all cursor-pointer lg:cursor-default ${isExpanded ? 'border-b' : ''}`}
                onClick={toggleExpand}
            >
                <div className="flex bg-slate-100 p-1 rounded-2xl ring-1 ring-slate-200/50" onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => selectTab('active')}
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
                        onClick={() => selectTab('history')}
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
                        <>
                            {/* El selector de fecha se muestra siempre, aunque el día elegido no tenga ventas */}
                            <div className="relative flex flex-col items-center mb-6">
                                <CalendarPopover
                                    selectedDate={filterToCalendarDate(dailyFilter)}
                                    onSelect={setDailyFilter}
                                    renderTrigger={({ ref, onClick, isOpen }) => (
                                        <button
                                            ref={ref}
                                            onClick={onClick}
                                            className="flex items-center gap-4 px-6 py-2 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-brand-navy hover:shadow-md transition-all active:scale-95 group"
                                        >
                                            <Calendar className="w-4 h-4 text-brand-navy" />
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest min-w-[60px] text-center">
                                                {formatFilterLabel(dailyFilter)}
                                            </span>
                                            <ChevronDown className={`w-3.5 h-3.5 text-slate-300 group-hover:text-brand-navy transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                                        </button>
                                    )}
                                />
                            </div>

                            {historyOrders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-300 py-12">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                                        <CheckCircle className="w-8 h-8 text-slate-100" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Historial vacío</p>
                                </div>
                            ) : (
                                <>
                                    {/* Table View (All Breakpoints) */}
                                    <div
                                        ref={scrollContainerRef}
                                        className={`w-full overflow-x-auto rounded-xl border border-slate-100 pb-2 custom-scrollbar ${isDraggingScroll ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
                                        onMouseDown={onScrollMouseDown}
                                        onMouseLeave={stopDragging}
                                        onMouseUp={stopDragging}
                                        onMouseMove={onScrollMouseMove}
                                    >
                                        <div style={{ minWidth: colWidths.reduce((a, b) => a + b, 0) + 'px' }}>
                                            {/* Table Header */}
                                            <div className="bg-slate-50/50 border-b border-slate-100" style={{ display: 'grid', gridTemplateColumns: gridTemplate }}>
                                                {COLUMN_HEADERS.map((header, idx) => (
                                                    <div key={header} className="relative px-2 py-3 flex items-center justify-center">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest select-none whitespace-nowrap">{header}</span>
                                                        {idx < COLUMN_HEADERS.length - 1 && (
                                                            <div
                                                                onMouseDown={(e) => onResizeStart(idx, e)}
                                                                onTouchStart={(e) => onResizeStart(idx, e)}
                                                                className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-brand-navy/20 transition-colors z-10"
                                                                style={{ transform: 'translateX(50%)' }}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Table Rows */}
                                            {historyOrders.map((p, i) => {
                                                const created = formatTime(p.timestamp_creacion);
                                                const timeDisplay = p.horario_entrega ? (
                                                    <div className="flex flex-col items-center leading-tight">
                                                        <span className="font-black text-slate-700">{p.horario_entrega}</span>
                                                        <span className="text-[9px] font-bold text-slate-400">In: {created}</span>
                                                    </div>
                                                ) : (
                                                    <span className="font-black text-slate-400">{created}</span>
                                                );

                                                return (
                                                    <div key={p.id} className={`${i < historyOrders.length - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50/80 transition-all duration-300`} style={{ display: 'grid', gridTemplateColumns: gridTemplate, alignItems: 'center' }}>
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
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{historyOrders.length} pedidos</span>
                                            <span className="text-2xl font-display font-black text-brand-navy tracking-tighter">
                                                ${sumMonto(historyOrders).toLocaleString('es-AR')}
                                            </span>
                                        </div>
                                        <div className="flex flex-row sm:flex-col gap-4 sm:gap-1 pl-0 sm:pl-6 border-l-0 sm:border-l border-slate-100 shrink-0 w-full sm:w-auto justify-end">
                                            <button type="button" className="text-[10px] font-black text-emerald-600 cursor-pointer hover:underline" onClick={() => setPaymentModal('Efectivo')}>
                                                EFECTIVO ${totalEfectivo.toLocaleString('es-AR')}
                                            </button>
                                            <button type="button" className="text-[10px] font-black text-brand-navy cursor-pointer hover:underline" onClick={() => setPaymentModal('Tarjeta')}>
                                                TARJETA ${totalTarjeta.toLocaleString('es-AR')}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        activeOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-300 py-12">
                                <div className="mb-4">
                                    <Frown className="w-12 h-12 text-slate-200/50" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No hay pedidos pendientes</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap justify-center gap-4">
                                {activeOrders.map(p => (
                                    <DailyOrderCard
                                        key={p.id}
                                        order={p}
                                        onSave={updatePedido}
                                        onDelete={deletePedido}
                                        onReady={markReady}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}

            {paymentModal && (
                <PaymentModal metodo={paymentModal} orders={historyOrders} onClose={() => setPaymentModal(null)} />
            )}
        </div>
    );
}
