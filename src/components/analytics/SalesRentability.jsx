// Tarjetas de ventas de Estadísticas: pedidos por franja horaria + efectivo/tarjeta,
// y el ranking de platos.

export function Card({ title, caption, children }) {
    return (
        <div className="bg-surface border border-line rounded-2xl p-5 flex flex-col gap-[18px] min-w-0">
            <div className="flex justify-between items-baseline gap-3">
                <h2 className="font-display text-[19px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
                {caption && <span className="text-xs text-ink-3">{caption}</span>}
            </div>
            {children}
        </div>
    );
}

function Empty() {
    return <p className="text-sm text-ink-3 py-8 text-center">Sin ventas en este período</p>;
}

export default function SalesRentability({ kpis }) {
    const horas = kpis.ventasPorHora
        .map((count, hour) => ({ hour, count }))
        .filter(h => h.count > 0);
    // Se muestran las horas entre la primera y la última con ventas
    const desde = horas[0]?.hour;
    const hasta = horas.at(-1)?.hour;
    const bars = horas.length ? kpis.ventasPorHora.slice(desde, hasta + 1).map((count, i) => ({ hour: desde + i, count })) : [];
    const max = Math.max(1, ...bars.map(b => b.count));
    const { pctEfectivo } = kpis.distribucionPago;

    return (
        <Card title="Ventas" caption="Pedidos por franja horaria">
            {bars.length === 0 ? <Empty /> : (
                <>
                    <div className="flex items-end gap-1.5 sm:gap-2.5 h-[180px]">
                        {bars.map(({ hour, count }) => (
                            <div key={hour} className="flex-1 min-w-0 flex flex-col items-center gap-1.5 h-full justify-end">
                                <span className="font-mono text-[10px] text-ink-3">{count || ''}</span>
                                <div
                                    className={`w-full rounded-t-md rounded-b-sm ${count === max ? 'bg-brand-red' : 'bg-brand-navy'}`}
                                    style={{ height: `${Math.max(count ? 4 : 0, Math.round((count / max) * 130))}px` }}
                                />
                                <span className="text-[11px] text-ink-2">{hour}h</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex h-2.5 rounded-full overflow-hidden bg-brand-navy">
                            <div className="bg-live" style={{ width: `${pctEfectivo}%` }} />
                        </div>
                        <div className="flex justify-between text-[13px]">
                            <span className="text-cash font-semibold">Efectivo {pctEfectivo}%</span>
                            <span className="text-card font-semibold">Tarjeta {100 - pctEfectivo}%</span>
                        </div>
                    </div>
                </>
            )}
        </Card>
    );
}

export function TopPlatosCard({ kpis }) {
    const ranking = kpis.topPlatos;

    return (
        <Card title="Platos más pedidos" caption="Top 5">
            {ranking.length === 0 ? <Empty /> : (
                <div className="flex flex-col gap-3.5">
                    {ranking.map((r, i) => (
                        <div key={r.name} className="grid grid-cols-[20px_minmax(0,1fr)_44px] gap-2.5 items-center">
                            <span className="font-mono text-xs text-ink-4">{i + 1}</span>
                            <div className="flex flex-col gap-[5px] min-w-0">
                                <span className="text-sm font-medium capitalize truncate">{r.name}</span>
                                <div className="h-1.5 rounded-full bg-[#F2EFE8]">
                                    <div className={`h-full rounded-full ${i === 0 ? 'bg-brand-red' : 'bg-brand-navy'}`} style={{ width: `${Math.round((r.count / ranking[0].count) * 100)}%` }} />
                                </div>
                            </div>
                            <span className="font-mono text-sm font-semibold text-right">{r.count}</span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
