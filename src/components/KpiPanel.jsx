import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { DollarSign, ShoppingBag, Banknote, CreditCard, X, Trophy, Calendar, ChevronDown } from 'lucide-react';
import CalendarPicker from './CalendarPicker';

export default function HeaderKpis() {
    const {
        salesKPIs, salesOrders, salesFilter, setSalesFilter,
        rankingKPIs, rankingOrders, rankingFilter, setRankingFilter
    } = useStore();

    const [activeCalendar, setActiveCalendar] = useState(null); // 'ventas' | 'ranking' | null
    const [activeModalCalendar, setActiveModalCalendar] = useState(false);
    const salesBtnRef = useRef(null);
    const rankingBtnRef = useRef(null);
    const modalCalendarBtnRef = useRef(null);

    // Close calendar on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activeCalendar && !e.target.closest('.calendar-popover') && !e.target.closest('.calendar-trigger')) {
                setActiveCalendar(null);
            }
            if (activeModalCalendar && !e.target.closest('.modal-calendar-popover') && !e.target.closest('.modal-calendar-trigger')) {
                setActiveModalCalendar(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeCalendar, activeModalCalendar]);

    // Sales Data
    const { totalVendido, distribucionPago } = salesKPIs;
    const efectivo = distribucionPago?.Efectivo || 0;
    const tarjeta = distribucionPago?.Tarjeta || 0;

    // Ranking Data
    const { pedidosCompletados } = rankingKPIs;

    const [modal, setModal] = useState(null); // 'ventas' | 'ranking' | null

    // Helper: Get data for current modal
    const currentOrders = modal === 'ventas' ? salesOrders : rankingOrders;
    const currentFilter = modal === 'ventas' ? salesFilter : rankingFilter;
    const setCurrentFilter = modal === 'ventas' ? setSalesFilter : setRankingFilter;

    const completedOrders = currentOrders.filter(p => p.estado === 'listo');

    // Build dish ranking from completed orders (if ranking modal)
    const dishCounts = {};
    if (modal === 'ranking') {
        completedOrders.forEach(p => {
            const items = (p.pedido || '').split(',').map(i => i.trim()).filter(Boolean);
            items.forEach(item => {
                // Handle quantity prefix like "(2) ensalada" → count 2
                const qtyMatch = item.match(/^\((\d+)\)\s*(.+)/);
                let qty = 1;
                let name = item;
                if (qtyMatch) {
                    qty = parseInt(qtyMatch[1], 10);
                    name = qtyMatch[2].trim();
                }
                // Skip non-dish tokens like "envio 1", "envio 2", etc.
                if (/^envio\s*\d*$/i.test(name)) return;
                const key = name.toLowerCase();
                dishCounts[key] = (dishCounts[key] || 0) + qty;
            });
        });
    }
    const ranking = Object.entries(dishCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const formatFilterLabel = (filter) => {
        if (filter === 'dia') return 'HOY';
        if (filter === 'semana') return 'SEM';
        if (filter === 'mes') return 'MES';

        // Handle YYYY-MM-DD
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

    return (
        <>
            {/* ── Compact KPI Chips ── */}
            <div className="flex items-center gap-4 relative">
                {/* Total Vendido Chip */}
                <div className="flex items-center h-10 bg-white/60 shadow-sm ring-1 ring-brand-navy/10 rounded-[14px] p-1 transition-all hover:shadow-md hover:ring-brand-navy/30 group backdrop-blur-md">
                    <button
                        onClick={() => setModal('ventas')}
                        className="flex items-center gap-2.5 px-3 h-full rounded-[10px] hover:bg-white transition-colors cursor-pointer"
                    >
                        <div className="bg-brand-navy/10 text-brand-navy p-1 rounded-md">
                            <DollarSign className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[13px] font-display font-black text-brand-navy tracking-tight">
                            ${(totalVendido || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                        </span>
                    </button>

                    <div className="w-px h-5 bg-slate-100 mx-1" />

                    <div
                        ref={salesBtnRef}
                        onClick={() => setActiveCalendar(activeCalendar === 'ventas' ? null : 'ventas')}
                        className="relative px-2 h-full flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors cursor-pointer calendar-trigger"
                    >
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-hover:text-primary-blue transition-colors">
                            {formatFilterLabel(salesFilter)}
                            <Calendar className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                        </span>
                    </div>

                    {/* Sales Calendar Popover using Portal */}
                    {activeCalendar === 'ventas' && salesBtnRef.current && createPortal(
                        <div
                            className="fixed z-[120] calendar-popover"
                            style={{
                                top: salesBtnRef.current.getBoundingClientRect().bottom + 8,
                                left: Math.max(10, Math.min(
                                    window.innerWidth - 330,
                                    salesBtnRef.current.getBoundingClientRect().left + (salesBtnRef.current.offsetWidth / 2) - 160
                                ))
                            }}
                        >
                            <CalendarPicker
                                selectedDate={salesFilter === 'dia' ? new Date().toISOString().split('T')[0] : salesFilter}
                                onSelect={(date) => { setSalesFilter(date); setActiveCalendar(null); }}
                                onClose={() => setActiveCalendar(null)}
                            />
                        </div>,
                        document.body
                    )}
                </div>

                {/* Pedidos Despachados Chip */}
                <div className="flex items-center h-10 bg-white/60 shadow-sm ring-1 ring-brand-navy/10 rounded-[14px] p-1 transition-all hover:shadow-md hover:ring-brand-red/30 group relative backdrop-blur-md">
                    <button
                        onClick={() => setModal('ranking')}
                        className="flex items-center gap-2.5 px-3 h-full rounded-[10px] hover:bg-white transition-colors cursor-pointer"
                    >
                        <div className="bg-brand-red/10 text-brand-red p-1 rounded-md">
                            <ShoppingBag className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[13px] font-display font-black text-brand-red tracking-tight">
                            {pedidosCompletados || 0}
                        </span>
                    </button>

                    <div className="w-px h-5 bg-slate-100 mx-1" />

                    <div
                        ref={rankingBtnRef}
                        onClick={() => setActiveCalendar(activeCalendar === 'ranking' ? null : 'ranking')}
                        className="relative px-2 h-full flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors cursor-pointer calendar-trigger"
                    >
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 group-hover:text-primary-blue transition-colors">
                            {formatFilterLabel(rankingFilter)}
                            <Calendar className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                        </span>
                    </div>

                    {/* Ranking Calendar Popover using Portal */}
                    {activeCalendar === 'ranking' && rankingBtnRef.current && createPortal(
                        <div
                            className="fixed z-[120] calendar-popover"
                            style={{
                                top: rankingBtnRef.current.getBoundingClientRect().bottom + 8,
                                left: Math.max(10, Math.min(
                                    window.innerWidth - 330,
                                    rankingBtnRef.current.getBoundingClientRect().left + (rankingBtnRef.current.offsetWidth / 2) - 160
                                ))
                            }}
                        >
                            <CalendarPicker
                                selectedDate={rankingFilter === 'dia' ? new Date().toISOString().split('T')[0] : rankingFilter}
                                onSelect={(date) => { setRankingFilter(date); setActiveCalendar(null); }}
                                onClose={() => setActiveCalendar(null)}
                            />
                        </div>,
                        document.body
                    )}
                </div>
            </div>

            {modal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)}>
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,40,85,0.08)] w-full max-w-lg max-h-[85vh] flex flex-col animate-card-in ring-1 ring-white/50" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-white/40 bg-white/40 rounded-t-[2.5rem] z-10">
                            <h2 className="text-xl font-display font-black text-brand-navy uppercase tracking-tighter flex items-center gap-3">
                                {modal === 'ventas' ? (
                                    <><div className="p-2 bg-brand-navy rounded-[14px] text-white shadow-sm"><DollarSign className="w-5 h-5" /></div> Registro de Ventas</>
                                ) : (
                                    <><div className="p-2 bg-brand-red rounded-[14px] text-white shadow-sm"><Trophy className="w-5 h-5" /></div> Ranking de Platos</>
                                )}
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    ref={modalCalendarBtnRef}
                                    onClick={() => setActiveModalCalendar(!activeModalCalendar)}
                                    className="appearance-none bg-white ring-1 ring-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 outline-none focus:ring-slate-900/10 cursor-pointer hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 modal-calendar-trigger group"
                                >
                                    {formatFilterLabel(currentFilter)}
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-300 group-hover:text-primary-blue transition-transform ${activeModalCalendar ? 'rotate-180' : ''}`} />
                                </button>

                                {activeModalCalendar && modalCalendarBtnRef.current && createPortal(
                                    <div
                                        className="fixed z-[120] modal-calendar-popover scale-95 origin-top"
                                        style={{
                                            top: modalCalendarBtnRef.current.getBoundingClientRect().bottom + 8,
                                            left: Math.max(10, Math.min(
                                                window.innerWidth - 330,
                                                modalCalendarBtnRef.current.getBoundingClientRect().left + (modalCalendarBtnRef.current.offsetWidth / 2) - 160
                                            ))
                                        }}
                                    >
                                        <CalendarPicker
                                            selectedDate={currentFilter === 'dia' ? new Date().toISOString().split('T')[0] : currentFilter}
                                            onSelect={(date) => { setCurrentFilter(date); setActiveModalCalendar(false); }}
                                            onClose={() => setActiveModalCalendar(false)}
                                        />
                                    </div>,
                                    document.body
                                )}
                                <button onClick={() => setModal(null)} className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-900 transition-all cursor-pointer">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="overflow-y-auto p-4 rounded-b-[2.5rem]">
                            {modal === 'ventas' ? (
                                /* Sales Detail */
                                completedOrders.length === 0 ? (
                                    <p className="text-gray-400 text-sm text-center py-8 italic">No hay ventas registradas</p>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="overflow-hidden rounded-xl border border-slate-200">
                                            <table className="w-full text-left border-collapse text-sm">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Cliente</th>
                                                        <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-5/12">Pedido</th>
                                                        <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center">Pago</th>
                                                        <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {completedOrders.map((p, i) => (
                                                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="py-2 px-3 font-semibold text-slate-800 align-middle">
                                                                {p.cliente.nombre}
                                                            </td>
                                                            <td className="py-2 px-3 text-slate-600 align-middle">
                                                                <span className="line-clamp-1" title={p.pedido}>{p.pedido}</span>
                                                            </td>
                                                            <td className="py-2 px-3 text-center align-middle">
                                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${p.metodo_pago === 'Efectivo'
                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                    : 'bg-blue-50 text-brand-navy border-blue-100'
                                                                    }`}>
                                                                    {p.metodo_pago === 'Efectivo' ? 'EFCT' : 'TARJ'}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-bold font-display align-middle">
                                                                <span className={p.metodo_pago === 'Efectivo' ? 'text-emerald-600' : 'text-brand-navy'}>
                                                                    ${p.monto.toLocaleString('es-AR')}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Summary Footer */}
                                        <div className="flex items-center justify-between bg-white/40 rounded-[24px] p-5 border border-white/60 shadow-sm shadow-brand-navy/5">
                                            <div className="flex gap-6">
                                                <div>
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Efectivo</span>
                                                    <span className="text-lg font-bold text-emerald-600">${efectivo.toLocaleString('es-AR')}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Tarjeta</span>
                                                    <span className="text-lg font-bold text-brand-navy">${tarjeta.toLocaleString('es-AR')}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Total</span>
                                                <span className="text-2xl font-black font-display text-brand-navy">${(totalVendido || 0).toLocaleString('es-AR')}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ) : (
                                /* Ranking Table */
                                ranking.length === 0 ? (
                                    <p className="text-gray-400 text-sm text-center py-8 italic">No hay datos aún</p>
                                ) : (
                                    <div className="overflow-hidden rounded-xl border border-slate-200">
                                        <table className="w-full text-left border-collapse text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-12 text-center">#</th>
                                                    <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Plato</th>
                                                    <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right w-24">Cant.</th>
                                                    <th className="py-2 px-3 font-bold text-slate-500 uppercase tracking-wider text-[10px] w-32 px-4">%</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {ranking.map((item, i) => {
                                                    const maxCount = ranking[0].count;
                                                    const pct = Math.round((item.count / maxCount) * 100);
                                                    return (
                                                        <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                                                            <td className="py-2 px-3 text-center font-black text-slate-300 align-middle">
                                                                {i + 1}
                                                            </td>
                                                            <td className="py-2 px-3 font-semibold text-slate-800 align-middle">
                                                                {item.name}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-bold text-brand-navy align-middle">
                                                                {item.count}
                                                            </td>
                                                            <td className="py-2 px-4 align-middle">
                                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-brand-red rounded-full"
                                                                        style={{ width: `${pct}%` }}
                                                                    />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
