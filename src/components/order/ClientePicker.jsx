import { useState } from 'react';
import { Search, MapPin, Plus } from 'lucide-react';
import { matchesSearch, getDirecciones, direccionLabel, hasDireccion } from '../../lib/clientes';

const MAX_RESULTS = 6;

function initials(nombre) {
    return (nombre || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// Cliente del nuevo pedido: buscador cuando no hay ninguno elegido, ficha con sus
// direcciones cuando sí. `ref` apunta al buscador (atajo F2).
export default function ClientePicker({ ref, clientes, cliente, onSelect, direccion, onDireccion, onSaveDireccion, isSavingDireccion, onManage }) {
    const [query, setQuery] = useState('');

    const matches = query.trim()
        ? clientes
            .filter(c => matchesSearch(query, c.nombre, ...getDirecciones(c).map(d => d.direccion)))
            .slice(0, MAX_RESULTS)
        : [];

    const pick = (c) => {
        onSelect(c.id);
        setQuery('');
    };

    const direcciones = cliente ? getDirecciones(cliente) : [];
    const canSaveDireccion = !!cliente && direccion.trim() !== '' && !hasDireccion(direcciones, direccion);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-ink-2">Cliente</span>
                <button type="button" onClick={onManage} className="text-xs font-medium text-brand-navy hover:underline cursor-pointer">
                    Gestionar clientes
                </button>
            </div>

            {!cliente ? (
                <div className="border border-line-strong rounded-xl overflow-hidden bg-surface">
                    <div className="flex items-center gap-2.5 px-3.5 h-11">
                        <Search className="w-4 h-4 text-ink-4 shrink-0" />
                        <input
                            ref={ref}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (matches[0]) pick(matches[0]);
                                } else if (e.key === 'Escape') {
                                    setQuery('');
                                }
                            }}
                            placeholder="Buscar por nombre o dirección"
                            autoComplete="off"
                            className="flex-1 min-w-0 h-full bg-transparent text-sm text-ink focus:outline-none"
                        />
                    </div>
                    {query.trim() && (
                        <div className="border-t border-line-soft max-h-64 overflow-y-auto">
                            {matches.length === 0 ? (
                                <p className="px-3.5 py-3 text-[13px] text-ink-3">Ningún cliente coincide. Agregalo en “Gestionar clientes”.</p>
                            ) : matches.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => pick(c)}
                                    className="w-full flex items-center gap-3 px-3.5 py-[9px] text-left hover:bg-[#F7F5F0] cursor-pointer"
                                >
                                    <span className="w-[30px] h-[30px] rounded-full bg-card-bg text-brand-navy text-[11px] font-bold flex items-center justify-center shrink-0">
                                        {initials(c.nombre)}
                                    </span>
                                    <span className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-ink">{c.nombre}</span>
                                        <span className="text-xs text-ink-3 truncate">{getDirecciones(c).map(d => d.direccion).join(' · ')}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="border border-line-strong rounded-xl px-3.5 py-3 flex flex-col gap-2.5">
                    <div className="flex items-center gap-3">
                        <span className="w-[34px] h-[34px] rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {initials(cliente.nombre)}
                        </span>
                        <span className="flex-1 min-w-0 text-[15px] font-semibold text-ink truncate">{cliente.nombre}</span>
                        <button
                            type="button"
                            onClick={() => onSelect(null)}
                            className="h-7 px-2.5 rounded-lg bg-paper hover:bg-track text-xs font-medium text-ink-2 cursor-pointer"
                        >
                            Cambiar
                        </button>
                    </div>

                    {(direcciones.length > 0 || canSaveDireccion) && (
                        <div className="flex flex-wrap gap-1.5">
                            {direcciones.map((d, i) => {
                                const isActive = hasDireccion([d], direccion);
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => onDireccion(d.direccion)}
                                        title={d.direccion}
                                        className={`h-7 px-2.5 rounded-full border text-xs font-medium cursor-pointer max-w-[14rem] truncate ${isActive
                                            ? 'border-brand-navy bg-brand-navy text-white'
                                            : 'border-line-strong bg-surface text-ink-2 hover:text-ink'
                                            }`}
                                    >
                                        {direccionLabel(d)}
                                    </button>
                                );
                            })}
                            {canSaveDireccion && (
                                <button
                                    type="button"
                                    onClick={onSaveDireccion}
                                    disabled={isSavingDireccion}
                                    className="h-7 px-2.5 rounded-full border border-dashed border-line-strong text-xs font-medium text-ink-2 hover:text-brand-navy hover:border-brand-navy/40 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                    <Plus className="w-3 h-3" />
                                    {isSavingDireccion ? 'Guardando…' : 'Guardar en el cliente'}
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2 h-10 px-3 rounded-[9px] bg-soft border border-line-soft">
                        <MapPin className="w-[15px] h-[15px] text-ink-3 shrink-0" />
                        <input
                            value={direccion}
                            onChange={e => onDireccion(e.target.value)}
                            placeholder="Dirección de entrega"
                            className="flex-1 min-w-0 h-full bg-transparent text-sm text-ink focus:outline-none"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
