import { useStore } from '../store/useStore';
import { TrendingUp, DollarSign, PackageCheck, Repeat } from 'lucide-react';
import SalesRentability from '../components/analytics/SalesRentability';
import CustomerLoyalty from '../components/analytics/CustomerLoyalty';

export default function AnalyticsView() {
    const {
        pedidos,
        analyticsKPIs: kpis,
        analyticsFilter,
        setAnalyticsFilter
    } = useStore();

    if (!kpis) return null;

    const topKpis = [
        { title: 'Venta Total', value: `$${Math.round(kpis.totalVendido).toLocaleString('es-AR')}`, icon: <DollarSign className="w-5 h-5" />, sub: 'Ingreso Bruto' },
        { title: 'Ticket Promedio', value: `$${Math.round(kpis.ticketPromedio).toLocaleString('es-AR')}`, icon: <TrendingUp className="w-5 h-5" />, sub: 'Promedio por Pedido' },
        { title: 'Recurrencia', value: `${kpis.porcentajeRecurrencia}%`, icon: <Repeat className="w-5 h-5" />, sub: 'Clientes recurrentes' },
    ];

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-4 lg:p-6 pb-24">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header & Filters */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-display font-black tracking-tighter text-brand-navy">
                            Dashboard de Estadísticas
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Análisis de Ventas y Fidelización
                        </p>
                    </div>
                    {/* Placeholder for Date Filter */}
                    <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
                        <button
                            onClick={() => setAnalyticsFilter('dia')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${analyticsFilter === 'dia' ? 'bg-white shadow-sm text-brand-navy' : 'text-slate-400 hover:text-slate-600'}`}
                        >Hoy</button>
                        <button
                            onClick={() => setAnalyticsFilter('semana')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${analyticsFilter === 'semana' ? 'bg-white shadow-sm text-brand-navy' : 'text-slate-400 hover:text-slate-600'}`}
                        >Semana</button>
                        <button
                            onClick={() => setAnalyticsFilter('mes')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${analyticsFilter === 'mes' ? 'bg-white shadow-sm text-brand-navy' : 'text-slate-400 hover:text-slate-600'}`}
                        >Mes</button>
                    </div>
                </div>

                {/* Top KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {topKpis.map((kpi, i) => (
                        <div key={i} className="glass-card rounded-[2rem] p-5 relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.title}</span>
                                <div className="p-2 bg-brand-navy/5 text-brand-navy rounded-xl group-hover:scale-110 group-hover:bg-brand-navy group-hover:text-white transition-all duration-300">
                                    {kpi.icon}
                                </div>
                            </div>
                            <div className="relative z-10">
                                <span className="text-3xl font-display font-black tracking-tighter text-slate-800">
                                    {kpi.value}
                                </span>
                            </div>
                            <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide relative z-10">
                                {kpi.sub}
                            </div>
                            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-brand-navy/5 rounded-full blur-2xl group-hover:bg-brand-navy/10 transition-all duration-500"></div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Rentability */}
                    <div className="glass-card rounded-[2rem] p-6 lg:p-8">
                        <h2 className="text-lg font-display font-black text-brand-navy tracking-tight mb-6">Ventas y Rentabilidad</h2>
                        <SalesRentability kpis={kpis} />
                    </div>

                    {/* Customer Loyalty */}
                    <div className="glass-card rounded-[2rem] p-6 lg:p-8">
                        <h2 className="text-lg font-display font-black text-brand-navy tracking-tight mb-6">Fidelización de Clientes</h2>
                        <CustomerLoyalty kpis={kpis} />
                    </div>
                </div>

            </div>
        </div>
    );
}
