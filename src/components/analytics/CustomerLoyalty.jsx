import { useState } from 'react';
import { UserPlus, Star } from 'lucide-react';
import { Card } from './SalesRentability';
import Modal from '../ui/Modal';

function SegmentButton({ icon: Icon, label, count, hint, tone, onClick }) {
    const disabled = count === 0;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex-1 min-w-0 text-left rounded-xl border px-4 py-3.5 flex flex-col gap-1 transition-colors cursor-pointer disabled:cursor-default disabled:opacity-50 ${tone === 'fieles' ? 'border-[#CFE7DA] bg-cash-bg/50 hover:bg-cash-bg' : 'border-[#D5E0EE] bg-card-bg/50 hover:bg-card-bg'}`}
        >
            <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${tone === 'fieles' ? 'text-cash' : 'text-card'}`}>
                <Icon className="w-4 h-4" />
                {label}
            </span>
            <span className="font-display text-[34px] font-bold tracking-[-0.03em] leading-none text-ink">{count}</span>
            <span className="text-xs text-ink-3">{hint}</span>
        </button>
    );
}

export default function CustomerLoyalty({ kpis }) {
    const [segment, setSegment] = useState(null); // 'nuevos' | 'fieles' | null

    const { nuevos, fieles, total } = kpis.segmentacion;
    const totalSegmented = (nuevos.length + fieles.length) || 1;
    const list = segment === 'nuevos' ? nuevos : fieles;

    return (
        <Card title="Fidelización" caption={`${total} clientes en el historial`}>
            <div className="flex gap-3 flex-wrap">
                <SegmentButton icon={UserPlus} label="Nuevos" count={nuevos.length} hint="1 solo pedido en todo el historial" tone="nuevos" onClick={() => setSegment('nuevos')} />
                <SegmentButton icon={Star} label="Fieles" count={fieles.length} hint="3 o más pedidos en el historial" tone="fieles" onClick={() => setSegment('fieles')} />
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-[#F2EFE8]">
                <div className="bg-brand-navy" style={{ width: `${(nuevos.length / totalSegmented) * 100}%` }} title="Nuevos" />
                <div className="bg-live" style={{ width: `${(fieles.length / totalSegmented) * 100}%` }} title="Fieles" />
            </div>
            <p className="text-xs text-ink-3">Tocá un grupo para ver la lista de clientes.</p>

            {segment && (
                <Modal
                    title={segment === 'nuevos' ? 'Clientes nuevos' : 'Clientes fieles'}
                    icon={segment === 'nuevos' ? UserPlus : Star}
                    onClose={() => setSegment(null)}
                    maxWidth="max-w-md"
                >
                    {list.map((cliente, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-line-soft">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-8 h-8 rounded-full bg-card-bg text-brand-navy text-xs font-bold flex items-center justify-center shrink-0">
                                    {cliente.nombre.trim().charAt(0).toUpperCase()}
                                </span>
                                <span className="font-medium text-ink capitalize truncate" title={cliente.nombre.trim()}>{cliente.nombre.trim()}</span>
                            </div>
                            <span className="font-mono text-sm font-semibold text-ink shrink-0">
                                {cliente.conteo} <span className="text-xs font-normal text-ink-3">{cliente.conteo === 1 ? 'pedido' : 'pedidos'}</span>
                            </span>
                        </div>
                    ))}
                </Modal>
            )}
        </Card>
    );
}
