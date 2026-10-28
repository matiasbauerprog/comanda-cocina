import { useStore } from '../store/useStore';
import SalesRentability, { TopPlatosCard } from '../components/analytics/SalesRentability';
import CustomerLoyalty from '../components/analytics/CustomerLoyalty';
import Segmented from '../components/ui/Segmented';
import { formatMoney } from '../lib/format';

const FILTERS = [
    { id: 'dia', label: 'Hoy' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
];

export default function AnalyticsView() {
    const { analyticsKPIs: kpis, analyticsFilter, setAnalyticsFilter } = useStore();

    const topKpis = [
        { title: 'Venta total', value: formatMoney(kpis.totalVendido), sub: `${kpis.cantidadPedidos} pedidos` },
        { title: 'Ticket promedio', value: formatMoney(kpis.ticketPromedio), sub: 'Por pedido' },
        { title: 'Recurrencia', value: `${kpis.porcentajeRecurrencia}%`, sub: 'Pedidos de clientes que repiten' },
    ];

    return (
        <div className="p-4 sm:p-6 pb-24 max-w-[1280px] w-full mx-auto flex flex-col gap-5">
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="font-display text-[32px] font-bold tracking-[-0.03em] text-ink">Estadísticas</h1>
                    <p className="mt-1 text-sm text-ink-3">Ventas y fidelización de clientes</p>
                </div>
                <Segmented options={FILTERS} value={analyticsFilter} onChange={setAnalyticsFilter} size="sm" />
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5">
                {topKpis.map(k => (
                    <div key={k.title} className="bg-surface border border-line rounded-2xl px-5 py-[18px] flex flex-col gap-1.5">
                        <span className="text-[13px] font-medium text-ink-2">{k.title}</span>
                        <span className="font-display text-[38px] font-bold tracking-[-0.03em] leading-[1.05] text-ink">{k.value}</span>
                        <span className="text-xs text-ink-3">{k.sub}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-3.5">
                <SalesRentability kpis={kpis} />
                <TopPlatosCard kpis={kpis} />
            </div>

            <CustomerLoyalty kpis={kpis} />
        </div>
    );
}
