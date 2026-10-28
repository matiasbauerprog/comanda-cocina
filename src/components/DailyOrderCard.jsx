import { useState } from 'react';
import { Edit3, X, Check, Trash2, MapPin } from 'lucide-react';
import { useOrderUrgency } from '../hooks/useOrderUrgency';
import { formatOrderStart } from '../lib/dates';

const URGENCY_STYLES = {
    none: { border: 'border-slate-200/60', badge: 'bg-slate-100 text-slate-400' },
    calm: { border: 'border-brand-navy/30', badge: 'bg-brand-navy/10 text-brand-navy' },
    soon: { border: 'border-brand-yellow/60', badge: 'bg-brand-yellow text-amber-900' },
    urgent: { border: 'border-brand-red/50', badge: 'bg-brand-red text-white' },
    late: { border: 'border-brand-red shadow-lg shadow-brand-red/10', badge: 'bg-brand-red text-white' },
};

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

export default function DailyOrderCard({ order, onSave, onDelete, onReady }) {
    const { urgency, countdownText } = useOrderUrgency(order);
    const s = URGENCY_STYLES[urgency];
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

    return (
        <div className={`glass-card rounded-[1.5rem] p-5 relative transition-all duration-500 hover:shadow-xl hover:shadow-brand-navy/5 group w-full max-w-[440px] border-2 ${s.border}`}>
            {isEditing ? (
                <div className="space-y-3">
                    <input
                        value={editForm.nombre}
                        onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-black text-brand-navy outline-none focus:ring-2 focus:ring-slate-900/5 focus:bg-white transition-all"
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
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-6 pr-3 py-2 text-sm text-brand-navy font-display font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="Monto"
                            />
                        </div>
                        <button onClick={saveEdit} disabled={busy} className="p-2 rounded-xl bg-brand-navy text-white hover:bg-black transition-all">
                            <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditForm(null)} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all">
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
                            <button onClick={() => setEditForm(toEditForm(order))} className="p-1.5 text-slate-300 hover:text-brand-navy hover:bg-slate-50 rounded-lg transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                            <button onClick={handleDelete} disabled={busy} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>

                    {/* 2. Sub-Header: Times */}
                    <div className="flex gap-4 mb-3 pb-3 border-b border-slate-50">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-0.5">Inicio</span>
                            <span className="text-[11px] font-bold text-slate-500">
                                {formatOrderStart(order.timestamp_creacion)}
                            </span>
                        </div>
                        {order.horario_entrega && (
                            <div className="flex flex-col border-l border-slate-100 pl-4">
                                <span className="text-[9px] font-black text-brand-navy/40 uppercase tracking-widest leading-none mb-0.5 whitespace-nowrap">Entrega</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black text-brand-navy">
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
                            onClick={() => run(() => onReady(order.id))}
                            disabled={busy}
                            className="bg-brand-red hover:bg-brand-red/90 text-white text-[10px] font-black px-5 py-2.5 rounded-xl shadow-lg shadow-brand-red/20 hover:shadow-xl active:scale-95 transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                        >
                            DESPACHAR
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
