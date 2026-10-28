import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Banknote, CreditCard, Calendar, ChevronDown } from 'lucide-react';
import CalendarPopover from './CalendarPopover';
import DailyOrderCard from './DailyOrderCard';
import Modal from './ui/Modal';
import PayBadge from './ui/PayBadge';
import { filterToCalendarDate, formatFilterLabel, formatTime, historyTitle } from '../lib/dates';
import { formatMoney } from '../lib/format';

function sumMonto(orders) {
    return orders.reduce((sum, p) => sum + p.monto, 0);
}

// Hora que se muestra en el historial: la de entrega o, si no tiene, la de carga.
function entregaLabel(p) {
    return p.horario_entrega || formatTime(p.timestamp_creacion);
}

function PaymentModal({ metodo, orders, onClose }) {
    const filtered = orders.filter(p => (metodo === 'Efectivo' ? p.metodo_pago === 'Efectivo' : p.metodo_pago !== 'Efectivo'));
    const isEfectivo = metodo === 'Efectivo';

    return (
        <Modal title={`Ventas en ${metodo.toLowerCase()}`} icon={isEfectivo ? Banknote : CreditCard} onClose={onClose} maxWidth="max-w-sm">
            {filtered.length === 0 ? (
                <p className="text-ink-3 text-sm text-center py-10">Sin ventas en {metodo.toLowerCase()}</p>
            ) : (
                filtered.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-line-soft">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink truncate">{p.cliente.nombre}</p>
                            <p className="text-xs text-ink-3 truncate">{p.pedido}</p>
                        </div>
                        <span className={`font-mono text-sm font-semibold shrink-0 ${isEfectivo ? 'text-cash' : 'text-card'}`}>{formatMoney(p.monto)}</span>
                    </div>
                ))
            )}
            <div className="px-5 py-4 bg-soft flex justify-between items-baseline">
                <span className="text-xs text-ink-3">Total {metodo.toLowerCase()}</span>
                <span className={`font-display text-2xl font-bold tracking-[-0.02em] ${isEfectivo ? 'text-cash' : 'text-card'}`}>{formatMoney(sumMonto(filtered))}</span>
            </div>
        </Modal>
    );
}

function Tab({ label, count, isActive, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`pb-1.5 flex items-baseline gap-2 border-b-2 cursor-pointer ${isActive ? 'border-ink' : 'border-transparent'}`}
        >
            <span className={`font-display text-[22px] font-bold tracking-[-0.02em] ${isActive ? 'text-ink' : 'text-ink-4 hover:text-ink-2'}`}>{label}</span>
            <span className="font-mono text-[13px] font-medium text-ink-3">{count}</span>
        </button>
    );
}

export default function DailyOrders() {
    const { pedidosActivos, pedidosHoy, deletePedido, updatePedido, markReady, dailyFilter, setDailyFilter } = useStore();
    const [tab, setTab] = useState('active');
    const [paymentModal, setPaymentModal] = useState(null);

    // La comanda muestra todos los pendientes, sin importar el día en que se cargaron.
    const activeOrders = pedidosActivos;
    const historyOrders = pedidosHoy.filter(p => p.estado === 'listo');
    const totalEfectivo = sumMonto(historyOrders.filter(p => p.metodo_pago === 'Efectivo'));
    const totalTarjeta = sumMonto(historyOrders.filter(p => p.metodo_pago !== 'Efectivo'));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-5 flex-wrap">
                    <Tab label="En curso" count={activeOrders.length} isActive={tab === 'active'} onClick={() => setTab('active')} />
                    <Tab label={historyTitle(dailyFilter)} count={historyOrders.length} isActive={tab === 'history'} onClick={() => setTab('history')} />
                </div>
                {tab === 'history' && (
                    <CalendarPopover
                        selectedDate={filterToCalendarDate(dailyFilter)}
                        onSelect={setDailyFilter}
                        renderTrigger={({ ref, onClick, isOpen }) => (
                            <button
                                ref={ref}
                                type="button"
                                onClick={onClick}
                                className="flex items-center gap-2 h-[34px] px-3 border border-line-strong rounded-[9px] bg-surface text-[13px] font-medium text-ink cursor-pointer hover:border-ink-3"
                            >
                                <Calendar className="w-[15px] h-[15px] text-ink-2" />
                                <span className="capitalize">{formatFilterLabel(dailyFilter).toLowerCase()}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-ink-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                    />
                )}
            </div>

            {tab === 'active' ? (
                activeOrders.length === 0 ? (
                    <div className="border border-dashed border-[#D6D0C3] rounded-[18px] px-6 py-16 flex flex-col items-center gap-1.5 text-ink-3 text-center">
                        <span className="font-display text-xl font-semibold text-ink">Sin pedidos en curso</span>
                        <span className="text-sm">Lo que cargues en “Nuevo pedido” aparece acá.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-3.5 items-start">
                        {activeOrders.map(p => (
                            <DailyOrderCard key={p.id} order={p} onSave={updatePedido} onDelete={deletePedido} onReady={markReady} />
                        ))}
                    </div>
                )
            ) : historyOrders.length === 0 ? (
                <div className="border border-dashed border-[#D6D0C3] rounded-[18px] px-6 py-16 flex flex-col items-center gap-1.5 text-ink-3 text-center">
                    <span className="font-display text-xl font-semibold text-ink">Todavía no hay pedidos despachados</span>
                    <span className="text-sm">Elegí otro día en el calendario para ver su historial.</span>
                </div>
            ) : (
                <div className="bg-surface border border-line rounded-[18px] overflow-hidden">
                    {/* Tabla en pantallas anchas */}
                    <table className="hidden sm:table w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-soft text-left">
                                {['Entrega', 'Cliente', 'Pedido', 'Pago'].map(h => (
                                    <th key={h} className="px-4 py-[11px] text-xs font-semibold text-ink-3 border-b border-line-soft">{h}</th>
                                ))}
                                <th className="px-4 py-[11px] text-xs font-semibold text-ink-3 border-b border-line-soft text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyOrders.map(p => (
                                <tr key={p.id} className="border-b border-[#F2EFE8]">
                                    <td className="px-4 py-3 font-mono text-[13px] text-ink whitespace-nowrap">{entregaLabel(p)}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-ink">{p.cliente.nombre}</div>
                                        <div className="text-xs text-ink-3">{p.cliente.direccion}</div>
                                    </td>
                                    <td className="px-4 py-3 text-ink-2 text-[13px]">{p.pedido}</td>
                                    <td className="px-4 py-3"><PayBadge metodo={p.metodo_pago} /></td>
                                    <td className="px-4 py-3 text-right font-mono font-semibold text-ink whitespace-nowrap">{formatMoney(p.monto)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Lista en celular */}
                    <div className="sm:hidden">
                        {historyOrders.map(p => (
                            <div key={p.id} className="px-4 py-3 border-b border-[#F2EFE8] flex flex-col gap-1">
                                <div className="flex items-baseline justify-between gap-3">
                                    <span className="font-semibold text-ink truncate">{p.cliente.nombre}</span>
                                    <span className="font-mono font-semibold text-ink shrink-0">{formatMoney(p.monto)}</span>
                                </div>
                                <div className="text-[13px] text-ink-2">{p.pedido}</div>
                                <div className="flex items-center gap-2 text-xs text-ink-3">
                                    <span className="font-mono">{entregaLabel(p)}</span>
                                    <PayBadge metodo={p.metodo_pago} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end items-center gap-8 px-5 py-4 border-t border-line-soft bg-soft flex-wrap">
                        <button type="button" onClick={() => setPaymentModal('Efectivo')} className="flex flex-col items-end cursor-pointer group">
                            <span className="text-xs text-ink-3 group-hover:underline">Efectivo</span>
                            <span className="font-mono text-[15px] font-semibold text-cash">{formatMoney(totalEfectivo)}</span>
                        </button>
                        <button type="button" onClick={() => setPaymentModal('Tarjeta')} className="flex flex-col items-end cursor-pointer group">
                            <span className="text-xs text-ink-3 group-hover:underline">Tarjeta</span>
                            <span className="font-mono text-[15px] font-semibold text-card">{formatMoney(totalTarjeta)}</span>
                        </button>
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-ink-3">{historyOrders.length} pedidos</span>
                            <span className="font-display text-[26px] font-bold tracking-[-0.02em] text-ink">{formatMoney(sumMonto(historyOrders))}</span>
                        </div>
                    </div>
                </div>
            )}

            {paymentModal && (
                <PaymentModal metodo={paymentModal} orders={historyOrders} onClose={() => setPaymentModal(null)} />
            )}
        </div>
    );
}
