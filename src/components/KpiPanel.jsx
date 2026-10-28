import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Trophy, Receipt, ChevronDown } from 'lucide-react';
import CalendarPopover from './CalendarPopover';
import Modal from './ui/Modal';
import PayBadge from './ui/PayBadge';
import { filterToCalendarDate, formatFilterLabel } from '../lib/dates';
import { formatMoney } from '../lib/format';

// Botón del filtro de cada KPI ("hoy ▾"), abre el calendario.
function filterTrigger(label, className = '') {
    return ({ ref, onClick, isOpen }) => (
        <button
            ref={ref}
            type="button"
            onClick={onClick}
            className={`flex items-center gap-1 text-xs text-ink-3 hover:text-ink transition-colors cursor-pointer lowercase ${className}`}
        >
            {label}
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
    );
}

// Los dos KPIs del Gestor (vendido y despachados), con su filtro y su detalle.
export default function HeaderKpis() {
    const {
        salesKPIs, salesOrders, salesFilter, setSalesFilter,
        rankingKPIs, rankingFilter, setRankingFilter
    } = useStore();

    const [modal, setModal] = useState(null); // 'ventas' | 'ranking' | null

    const { totalVendido, distribucionPago } = salesKPIs;
    const efectivo = distribucionPago.Efectivo || 0;
    const tarjeta = distribucionPago.Tarjeta || 0;
    const { pedidosCompletados, ranking } = rankingKPIs;

    const currentFilter = modal === 'ventas' ? salesFilter : rankingFilter;
    const setCurrentFilter = modal === 'ventas' ? setSalesFilter : setRankingFilter;
    const completedSales = salesOrders.filter(p => p.estado === 'listo');

    return (
        <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-5 min-w-0">
                <div className="flex items-baseline gap-1.5">
                    <button type="button" onClick={() => setModal('ventas')} className="font-mono text-sm font-semibold text-ink hover:text-brand-navy cursor-pointer">
                        {formatMoney(totalVendido)}
                    </button>
                    <CalendarPopover
                        selectedDate={filterToCalendarDate(salesFilter)}
                        onSelect={setSalesFilter}
                        renderTrigger={filterTrigger(formatFilterLabel(salesFilter))}
                    />
                </div>
                <div className="flex items-baseline gap-1.5">
                    <button type="button" onClick={() => setModal('ranking')} className="flex items-baseline gap-1.5 cursor-pointer group">
                        <span className="font-mono text-sm font-semibold text-ink group-hover:text-brand-navy">{pedidosCompletados || 0}</span>
                        <span className="text-xs text-ink-3">despachados</span>
                    </button>
                    <CalendarPopover
                        selectedDate={filterToCalendarDate(rankingFilter)}
                        onSelect={setRankingFilter}
                        renderTrigger={filterTrigger(formatFilterLabel(rankingFilter))}
                    />
                </div>
            </div>

            {modal && (
                <Modal
                    title={modal === 'ventas' ? 'Registro de ventas' : 'Ranking de platos'}
                    icon={modal === 'ventas' ? Receipt : Trophy}
                    onClose={() => setModal(null)}
                    actions={
                        <CalendarPopover
                            selectedDate={filterToCalendarDate(currentFilter)}
                            onSelect={setCurrentFilter}
                            renderTrigger={filterTrigger(formatFilterLabel(currentFilter), 'h-[34px] px-3 border border-line-strong rounded-[9px] bg-surface text-[13px] font-medium !text-ink')}
                        />
                    }
                >
                    {modal === 'ventas' ? (
                        completedSales.length === 0 ? (
                            <p className="text-ink-3 text-sm text-center py-10">No hay ventas registradas</p>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-soft text-left">
                                                <th className="px-4 py-2.5 text-xs font-semibold text-ink-3 border-b border-line-soft">Cliente</th>
                                                <th className="px-4 py-2.5 text-xs font-semibold text-ink-3 border-b border-line-soft">Pedido</th>
                                                <th className="px-4 py-2.5 text-xs font-semibold text-ink-3 border-b border-line-soft">Pago</th>
                                                <th className="px-4 py-2.5 text-xs font-semibold text-ink-3 border-b border-line-soft text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {completedSales.map(p => (
                                                <tr key={p.id} className="border-b border-[#F2EFE8]">
                                                    <td className="px-4 py-2.5 font-semibold text-ink">{p.cliente.nombre}</td>
                                                    <td className="px-4 py-2.5 text-ink-2 text-[13px]"><span className="line-clamp-1" title={p.pedido}>{p.pedido}</span></td>
                                                    <td className="px-4 py-2.5"><PayBadge metodo={p.metodo_pago} /></td>
                                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-ink">{formatMoney(p.monto)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-end items-center gap-8 px-5 py-4 bg-soft border-t border-line-soft flex-wrap">
                                    <div className="flex flex-col items-end"><span className="text-xs text-ink-3">Efectivo</span><span className="font-mono text-[15px] font-semibold text-cash">{formatMoney(efectivo)}</span></div>
                                    <div className="flex flex-col items-end"><span className="text-xs text-ink-3">Tarjeta</span><span className="font-mono text-[15px] font-semibold text-card">{formatMoney(tarjeta)}</span></div>
                                    <div className="flex flex-col items-end"><span className="text-xs text-ink-3">Total</span><span className="font-display text-[26px] font-bold tracking-[-0.02em] text-ink">{formatMoney(totalVendido)}</span></div>
                                </div>
                            </>
                        )
                    ) : (
                        ranking.length === 0 ? (
                            <p className="text-ink-3 text-sm text-center py-10">No hay datos aún</p>
                        ) : (
                            <div className="p-5 flex flex-col gap-3.5">
                                {ranking.map((item, i) => (
                                    <div key={item.name} className="grid grid-cols-[20px_minmax(0,1fr)_44px] gap-2.5 items-center">
                                        <span className="font-mono text-xs text-ink-4">{i + 1}</span>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-sm font-medium capitalize">{item.name}</span>
                                            <div className="h-1.5 rounded-full bg-[#F2EFE8]">
                                                <div className={`h-full rounded-full ${i === 0 ? 'bg-brand-red' : 'bg-brand-navy'}`} style={{ width: `${Math.round((item.count / ranking[0].count) * 100)}%` }} />
                                            </div>
                                        </div>
                                        <span className="font-mono text-sm font-semibold text-right">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </Modal>
            )}
        </>
    );
}
