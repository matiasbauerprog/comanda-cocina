import { useOrderUrgency } from '../hooks/useOrderUrgency';
import { formatTime } from '../lib/dates';
import { pedidoDisplayItems } from '../lib/pedidos';
import { URGENCY_THEME, countdownLabel } from '../lib/urgency';
import { formatMoney } from '../lib/format';

// Tarjeta de la Comanda: letra grande para leer de lejos, color según la urgencia.
export default function KitchenCard({ order }) {
    const { urgency, minutesLeft } = useOrderUrgency(order);
    const theme = URGENCY_THEME[urgency];

    return (
        <article className="animate-card-in bg-night-card rounded-[18px] overflow-hidden border-2" style={{ borderColor: theme.kBorder }}>
            <div className="flex items-center justify-between px-[18px] py-3" style={{ background: theme.kBg, color: theme.kFg }}>
                <span className="font-mono text-[28px] font-semibold tracking-[-0.03em]">{order.horario_entrega || '--:--'}</span>
                <span className="text-[15px] font-bold">{countdownLabel(minutesLeft)}</span>
            </div>
            <div className="px-[18px] pt-4 pb-1.5">
                <div className="text-xl font-bold text-night-ink tracking-[-0.01em]">{order.cliente.nombre}</div>
                <div className="text-[13px] text-night-ink-2 mt-0.5">
                    {order.cliente.direccion ? `${order.cliente.direccion} · ` : ''}ingresó {formatTime(order.timestamp_creacion)}
                </div>
            </div>
            <div className="px-[18px] pt-2.5 pb-4 flex flex-col gap-2">
                {pedidoDisplayItems(order.pedido).map((it, i) => (
                    <div key={i} className="flex gap-3 items-baseline text-[19px] text-night-ink font-medium">
                        <span className="font-mono font-semibold text-brand-yellow min-w-[30px]">{it.qty}×</span>
                        <span>{it.name}</span>
                    </div>
                ))}
                {order.observaciones && (
                    <div className="mt-1.5 bg-brand-yellow text-[#1F1700] rounded-[10px] px-3 py-[9px] text-[15px] font-semibold">
                        {order.observaciones}
                    </div>
                )}
            </div>
            <div className="flex justify-between px-[18px] py-3 border-t border-night-line text-sm text-night-ink-2">
                <span>Cobrar <span className="font-mono text-night-ink font-semibold">{formatMoney(order.monto)}</span></span>
                <span className="text-night-ink font-semibold">{order.metodo_pago}</span>
            </div>
        </article>
    );
}
