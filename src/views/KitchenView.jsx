import { useStore } from '../store/useStore';
import KitchenCard from '../components/KitchenCard';
import { ChefHat } from 'lucide-react';

export default function KitchenView() {
    const { pedidosActivos } = useStore();

    const activeOrders = pedidosActivos
        .filter(p => p.estado === 'pendiente' || p.estado === 'en_proceso')
        .sort((a, b) => {
            const aHas = !!a.horario_entrega;
            const bHas = !!b.horario_entrega;
            if (aHas && !bHas) return -1;
            if (!aHas && bHas) return 1;
            if (aHas && bHas) return a.horario_entrega.localeCompare(b.horario_entrega);
            return 0;
        });

    return (
        <div className="h-full overflow-y-auto p-3 lg:p-4">
            {activeOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 py-12">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-slate-100 ring-1 ring-slate-50">
                        <ChefHat className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Sin pedidos activos</p>
                    <p className="text-[10px] font-bold text-slate-300 mt-2 uppercase tracking-wide">La cocina está tranquila</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 auto-rows-min">
                    {activeOrders.map(order => (
                        <KitchenCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}
