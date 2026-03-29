import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Clock, AlertTriangle, User } from 'lucide-react';

export default function KitchenCard({ order }) {
    const [minutesLeft, setMinutesLeft] = useState(null);

    const hasTime = !!order.horario_entrega;

    // Calculate time remaining
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

    // Progressive urgency: calm > soon > urgent > late
    const urgency = !hasTime ? 'none'
        : minutesLeft === null ? 'none'
            : minutesLeft <= 0 ? 'late'
                : minutesLeft <= 10 ? 'urgent'
                    : minutesLeft <= 25 ? 'soon'
                        : 'calm';

    const styles = {
        none: { border: 'border-slate-200/60', headerBg: 'bg-slate-50/50', headerBorder: 'border-slate-100', clockColor: 'text-slate-400', timeColor: 'text-slate-600', badgeBg: '', badgeText: '' },
        calm: { border: 'border-brand-navy/30', headerBg: 'bg-brand-navy/5', headerBorder: 'border-brand-navy/10', clockColor: 'text-brand-navy', timeColor: 'text-brand-navy', badgeBg: 'bg-brand-navy/10 border border-brand-navy/20', badgeText: 'text-brand-navy' },
        soon: { border: 'border-brand-yellow/60', headerBg: 'bg-brand-yellow/10', headerBorder: 'border-brand-yellow/20', clockColor: 'text-amber-600', timeColor: 'text-amber-700', badgeBg: 'bg-brand-yellow', badgeText: 'text-amber-900' },
        urgent: { border: 'border-brand-red/50', headerBg: 'bg-brand-red/10', headerBorder: 'border-brand-red/20', clockColor: 'text-brand-red', timeColor: 'text-brand-red', badgeBg: 'bg-brand-red', badgeText: 'text-white' },
        late: { border: 'border-brand-red shadow-xl shadow-brand-red/20', headerBg: 'bg-brand-red/10', headerBorder: 'border-brand-red/30', clockColor: 'text-brand-red', timeColor: 'text-brand-red', badgeBg: 'bg-brand-red', badgeText: 'text-white' },
    };
    const s = styles[urgency];

    const countdownText = minutesLeft === null ? null
        : minutesLeft <= 0 ? 'ATRASADO'
            : minutesLeft >= 60 ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`
                : `${minutesLeft} min`;

    return (
        <div className={`animate-card-in glass-card rounded-[2rem] border-4 ${s.border} flex flex-col overflow-hidden relative group transition-all duration-300`}>

            {/* 1. Header: Client Info */}
            <div className={`px-5 py-4 border-b ${s.headerBorder} ${s.headerBg}`}>
                <h3 className="font-black text-brand-navy uppercase tracking-tight text-lg leading-tight">
                    {order.cliente.nombre}
                </h3>
                {order.cliente.direccion && (
                    <div className="flex items-center gap-1.5 mt-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-500 text-xs">{order.cliente.direccion}</span>
                    </div>
                )}
            </div>

            {/* 2. Sub-Header: Time & Urgency */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100 bg-white/50">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Inicio</span>
                    <span className="text-xs font-bold text-slate-600">
                        {new Date(order.timestamp_creacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                </div>

                <div className="flex flex-col items-end">
                    <span className={`text-[9px] font-black uppercase tracking-widest leading-none mb-0.5 ${hasTime ? 'text-brand-navy/60' : 'text-slate-400'}`}>Entrega</span>
                    <div className="flex items-center gap-2">
                        {hasTime ? (
                            <span className={`text-lg font-display font-black tracking-tight ${s.timeColor}`}>
                                {order.horario_entrega}
                            </span>
                        ) : (
                            <span className="text-sm font-bold text-gray-300">--:--</span>
                        )}
                        {hasTime && countdownText && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full tracking-wide shadow-sm ${s.badgeBg} ${s.badgeText}`}>
                                {countdownText}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. Body: Order & Notes */}
            <div className="px-6 py-5 flex-1 relative bg-white flex flex-col gap-3">
                <p className="text-sm text-gray-700 font-bold leading-relaxed">{order.pedido}</p>

                {order.observaciones && (
                    <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2.5">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-yellow-700 leading-snug uppercase tracking-wide">{order.observaciones}</p>
                    </div>
                )}
            </div>

            {/* 4. Footer: Price & Payment */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cobrar</span>
                    <span className={`text-xl font-display font-black tracking-tighter leading-none ${order.metodo_pago === 'Efectivo' ? 'text-emerald-600' : 'text-brand-navy'}`}>
                        ${order.monto.toLocaleString('es-AR')}
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Método</span>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ring-1 ${order.metodo_pago === 'Efectivo' ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : 'bg-blue-50 text-brand-navy ring-blue-100'}`}>
                        {order.metodo_pago}
                    </span>
                </div>
            </div>
        </div>
    );

}
