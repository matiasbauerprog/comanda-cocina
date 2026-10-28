import { useStore } from '../store/useStore';
import KitchenCard from '../components/KitchenCard';

const LEGEND = [
    { color: '#E60000', label: 'Atrasado' },
    { color: '#FF6B6B', label: '≤10 min' },
    { color: '#FFD700', label: '≤25 min' },
    { color: '#5B7FB0', label: 'Con tiempo' },
];

export default function KitchenView() {
    const { pedidosActivos: activeOrders } = useStore();

    return (
        <div className="min-h-full bg-night p-4 sm:p-6 flex flex-col gap-5">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-3.5">
                    <h1 className="font-display text-[32px] font-bold tracking-[-0.03em] text-night-ink">Comanda</h1>
                    <span className="font-mono text-[15px] text-night-ink-2">{activeOrders.length} en curso</span>
                </div>
                <div className="flex gap-4 flex-wrap text-[13px] text-night-ink-2">
                    {LEGEND.map(({ color, label }) => (
                        <span key={label} className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: color }} />
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            {activeOrders.length === 0 ? (
                <div className="border border-dashed border-night-line rounded-[18px] px-6 py-20 flex flex-col items-center gap-1.5 text-center">
                    <span className="font-display text-2xl font-semibold text-night-ink">Sin pedidos en curso</span>
                    <span className="text-sm text-night-ink-2">La cocina está tranquila.</span>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-4 items-start">
                    {activeOrders.map(order => (
                        <KitchenCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}
