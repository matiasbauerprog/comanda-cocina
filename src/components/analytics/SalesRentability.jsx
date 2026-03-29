import { TrendingUp, Utensils, Clock, DollarSign } from 'lucide-react';

export default function SalesRentability({ kpis }) {
    if (!kpis) return null;

    const maxSales = Math.max(...kpis.ventasPorHora, 1);

    return (
        <div className="flex flex-col gap-8">
            {/* 1. Top Platos (Approximated Margin) */}
            <div>
                <h3 className="text-sm font-display font-black text-brand-navy tracking-wide mb-4 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-brand-yellow" />
                    Top 5 Platos (Margen Est.)
                </h3>
                {kpis.topPlatosRentables.length > 0 ? (
                    <div className="space-y-3">
                        {/* EXPLICACIÓN: Usamos 'plato.name' en vez de 'i' como key.
                            Evita bugs visuales de re-renderizado cuando las posiciones en los rankings cambian. */}
                        {kpis.topPlatosRentables.map((plato, i) => (
                            <div key={plato.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-6 h-6 shrink-0 rounded-full bg-white flex items-center justify-center text-[10px] font-black tracking-tighter text-slate-400 shadow-sm">
                                        {i + 1}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 capitalize truncate" title={plato.name}>{plato.name}</span>
                                </div>
                                <div className="flex items-center gap-4 shrink-0 pl-2">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">{plato.count} u.</div>
                                    <div className="text-sm font-display font-black text-emerald-600">
                                        ~${Math.round(plato.margenEstimado).toLocaleString('es-AR')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        Sin datos suficientes
                    </div>
                )}
            </div>

            {/* 3. Hourly Heatmap */}
            <div>
                <h3 className="text-sm font-display font-black text-brand-navy tracking-wide mb-6 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-blue" />
                    Ventas por Franja Horaria
                </h3>
                <div className="h-32 w-full flex items-end gap-1 px-1">
                    {kpis.ventasPorHora.map((count, hour) => {
                        if (hour < 8 || hour > 23) return null; // 8am to 11pm roughly
                        const height = count > 0 ? Math.max((count / maxSales) * 100, 10) : 0;
                        return (
                            <div key={hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                {count > 0 && (
                                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-navy text-white text-[9px] font-black px-2 py-1 rounded-md mb-1 pointer-events-none z-10 whitespace-nowrap">
                                        {count} ped.
                                    </div>
                                )}
                                <div
                                    className={`w-full rounded-t-md transition-all duration-500 cursor-pointer ${count > 0 ? (count === maxSales ? 'bg-brand-red' : 'bg-brand-navy/60 hover:bg-brand-navy') : 'bg-slate-100'}`}
                                    style={{ height: `${height}%` }}
                                />
                                <span className={`text-[9px] font-bold mt-2 ${count > 0 ? 'text-slate-600' : 'text-slate-300'}`}>
                                    {hour}h
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
