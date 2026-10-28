import { useState } from 'react';
import { Pencil, X, Check, Trash2, MapPin, MessageSquareText } from 'lucide-react';
import { useOrderUrgency } from '../hooks/useOrderUrgency';
import { formatTime } from '../lib/dates';
import { pedidoDisplayItems } from '../lib/pedidos';
import { URGENCY_THEME, countdownLabel } from '../lib/urgency';
import { formatMoney } from '../lib/format';
import PayBadge from './ui/PayBadge';
import { useToast } from './ui/Toast';

function toEditForm(order) {
    return {
        nombre: order.cliente.nombre,
        direccion: order.cliente.direccion,
        pedido: order.pedido,
        observaciones: order.observaciones || '',
        monto: order.monto,
        metodo_pago: order.metodo_pago,
        horario_entrega: order.horario_entrega || '',
    };
}

const editInput = "w-full h-10 bg-surface border border-line-strong rounded-[9px] px-3 text-sm text-ink focus:outline-none focus:border-ink-3";
const iconButton = "w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 transition-colors cursor-pointer disabled:opacity-50";

export default function DailyOrderCard({ order, onSave, onDelete, onReady }) {
    const { urgency, minutesLeft } = useOrderUrgency(order);
    const theme = URGENCY_THEME[urgency];
    const toast = useToast();
    const [editForm, setEditForm] = useState(null);
    const [busy, setBusy] = useState(false);
    const isEditing = editForm !== null;

    const run = async (action) => {
        setBusy(true);
        const ok = await action();
        setBusy(false);
        return ok;
    };

    const saveEdit = async () => {
        const ok = await run(() => onSave(order.id, {
            cliente_nombre: editForm.nombre,
            cliente_direccion: editForm.direccion,
            pedido: editForm.pedido,
            observaciones: editForm.observaciones,
            monto: parseFloat(editForm.monto) || 0,
            metodo_pago: editForm.metodo_pago,
            horario_entrega: editForm.horario_entrega,
        }));
        if (ok) setEditForm(null);
    };

    const handleDelete = () => {
        if (!window.confirm(`¿Eliminar el pedido de ${order.cliente.nombre}?`)) return;
        run(() => onDelete(order.id));
    };

    const handleReady = async () => {
        if (await run(() => onReady(order.id))) toast(`${order.cliente.nombre} despachado`);
    };

    const set = (key) => (e) => setEditForm(f => ({ ...f, [key]: e.target.value }));

    return (
        <article
            className="bg-surface rounded-2xl overflow-hidden flex flex-col border"
            style={{ borderColor: theme.border, boxShadow: urgency === 'late' ? '0 6px 20px rgba(230,0,0,0.14)' : 'none' }}
        >
            <div className="flex items-center justify-between px-3.5 py-2.5" style={{ background: theme.stripBg, color: theme.stripFg }}>
                <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xl font-semibold tracking-[-0.02em]">{order.horario_entrega || '--:--'}</span>
                    <span className="text-xs font-semibold">{countdownLabel(minutesLeft)}</span>
                </div>
                <span className="text-[11px] opacity-80">Ingresó {formatTime(order.timestamp_creacion)}</span>
            </div>

            {isEditing ? (
                <div className="p-3.5 flex flex-col gap-2.5">
                    <input value={editForm.nombre} onChange={set('nombre')} className={`${editInput} font-semibold`} placeholder="Cliente" />
                    <input value={editForm.direccion} onChange={set('direccion')} className={editInput} placeholder="Dirección" />
                    <textarea value={editForm.pedido} onChange={set('pedido')} rows={2} className={`${editInput} h-auto py-2 resize-none`} placeholder="Pedido" />
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex bg-paper p-[3px] rounded-[9px] h-10">
                            {['Efectivo', 'Tarjeta'].map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setEditForm(f => ({ ...f, metodo_pago: m }))}
                                    className={`flex-1 rounded-md text-xs font-semibold cursor-pointer ${editForm.metodo_pago === m
                                        ? (m === 'Efectivo' ? 'bg-[#0E7A4B] text-white' : 'bg-brand-navy text-white')
                                        : 'text-ink-2'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                        <input type="time" value={editForm.horario_entrega} onChange={set('horario_entrega')} className={`${editInput} font-mono`} />
                    </div>
                    <input value={editForm.observaciones} onChange={set('observaciones')} className={editInput} placeholder="Observaciones" />
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-ink-3">$</span>
                            <input
                                type="number"
                                value={editForm.monto}
                                onChange={set('monto')}
                                className={`${editInput} pl-6 font-mono font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                                placeholder="Monto"
                            />
                        </div>
                        <button type="button" onClick={saveEdit} disabled={busy} className="h-10 px-3 rounded-[9px] bg-brand-navy text-white flex items-center gap-1.5 text-[13px] font-semibold cursor-pointer disabled:opacity-50">
                            <Check className="w-4 h-4" />
                            Guardar
                        </button>
                        <button type="button" onClick={() => setEditForm(null)} className="h-10 w-10 rounded-[9px] bg-paper text-ink-2 hover:bg-track flex items-center justify-center cursor-pointer" title="Cancelar">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="px-3.5 pt-3.5 pb-3 flex flex-col gap-[3px]">
                        <span className="text-base font-semibold text-ink tracking-[-0.01em]">{order.cliente.nombre}</span>
                        {order.cliente.direccion && (
                            <span className="flex items-center gap-[5px] text-xs text-ink-3">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {order.cliente.direccion}
                            </span>
                        )}
                    </div>
                    <div className="mx-3.5 border-t border-dashed border-line-strong" />
                    <div className="px-3.5 py-2.5 flex flex-col gap-[5px]">
                        {pedidoDisplayItems(order.pedido).map((it, i) => (
                            <div key={i} className="flex gap-2.5 text-sm text-ink">
                                <span className="font-mono font-semibold min-w-[22px] text-ink-2">{it.qty}×</span>
                                <span>{it.name}</span>
                            </div>
                        ))}
                        {order.observaciones && (
                            <div className="mt-1.5 flex gap-[7px] items-start bg-note-bg text-note rounded-lg px-[9px] py-[7px] text-xs font-medium">
                                <MessageSquareText className="w-[13px] h-[13px] mt-px shrink-0" />
                                {order.observaciones}
                            </div>
                        )}
                    </div>
                    <div className="mt-auto pl-3.5 pr-2.5 py-2.5 border-t border-line-soft flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[15px] font-semibold text-ink">{formatMoney(order.monto)}</span>
                            <PayBadge metodo={order.metodo_pago} />
                        </div>
                        <button type="button" onClick={() => setEditForm(toEditForm(order))} className={`${iconButton} hover:bg-paper hover:text-ink`} title="Editar">
                            <Pencil className="w-[15px] h-[15px]" />
                        </button>
                        <button type="button" onClick={handleDelete} disabled={busy} className={`${iconButton} hover:bg-danger-bg hover:text-danger`} title="Eliminar">
                            <Trash2 className="w-[15px] h-[15px]" />
                        </button>
                        <button
                            type="button"
                            onClick={handleReady}
                            disabled={busy}
                            className="h-[34px] px-3 rounded-[9px] bg-brand-navy hover:bg-[#001A3A] text-white text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Despachar
                        </button>
                    </div>
                </>
            )}
        </article>
    );
}
