import { useRef, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { searchPlatos } from '../../lib/orderForm';
import { formatMoney } from '../../lib/format';

const MAX_RESULTS = 30;

// Platos del nuevo pedido: buscador (Enter agrega el primero) y, con el buscador
// vacío, botones con los más pedidos.
export default function PlatoPicker({ platos, lines, masPedidos, onAdd, onManage }) {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    const results = searchPlatos(platos, query);
    const qtyOf = (plato) => lines.find(l => l.platoId === plato.id)?.cantidad ?? 0;

    // Solo se vuelve al buscador si se agregó con Enter: en el celular, enfocar
    // después de un toque abriría el teclado cada vez.
    const add = (plato, { refocus = false } = {}) => {
        onAdd(plato);
        setQuery('');
        if (refocus) inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-ink-2">Platos</span>
                <button type="button" onClick={onManage} className="text-xs font-medium text-brand-navy hover:underline cursor-pointer">
                    Editar carta
                </button>
            </div>

            <div className="border border-line-strong rounded-xl overflow-hidden bg-surface">
                <div className="flex items-center gap-2.5 px-3.5 h-11">
                    <Search className="w-4 h-4 text-ink-4 shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (results[0]) add(results[0], { refocus: true });
                            } else if (e.key === 'Escape') {
                                setQuery('');
                            }
                        }}
                        placeholder={`Buscar entre ${platos.length} platos`}
                        autoComplete="off"
                        className="flex-1 min-w-0 h-full bg-transparent text-sm text-ink focus:outline-none"
                    />
                    {query.trim() && (
                        <kbd className="hidden sm:inline font-mono text-[11px] px-1.5 py-0.5 border border-line-strong border-b-2 rounded-[5px] bg-soft text-ink-2">↵ agrega</kbd>
                    )}
                </div>
                {query.trim() && (
                    <div className="border-t border-line-soft max-h-[232px] overflow-y-auto">
                        {results.length === 0 ? (
                            <p className="px-3.5 py-3.5 text-[13px] text-ink-3">Ningún plato coincide. Revisá la carta en “Editar carta”.</p>
                        ) : results.slice(0, MAX_RESULTS).map((p, i) => {
                            const qty = qtyOf(p);
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => add(p)}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-[9px] text-left hover:bg-[#F7F5F0] cursor-pointer ${i === 0 ? 'bg-soft' : ''}`}
                                >
                                    <span className="flex-1 min-w-0 text-sm text-ink truncate">{p.nombre}</span>
                                    {qty > 0 && (
                                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-ink text-white font-mono text-[11px] font-semibold flex items-center justify-center">{qty}</span>
                                    )}
                                    <span className="font-mono text-xs text-ink-3">{formatMoney(p.monto)}</span>
                                    <Plus className="w-[15px] h-[15px] text-ink-2 shrink-0" />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {!query.trim() && masPedidos.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] text-ink-3">Más pedidos</span>
                    <div className="flex flex-wrap gap-1.5">
                        {masPedidos.map(p => {
                            const qty = qtyOf(p);
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => add(p)}
                                    className={`h-[30px] px-2.5 rounded-full border text-xs font-medium text-ink flex items-center gap-1.5 hover:border-ink cursor-pointer ${qty > 0 ? 'border-ink bg-soft' : 'border-line-strong bg-surface'}`}
                                >
                                    {p.nombre}
                                    {qty > 0 && <span className="font-mono text-[11px] font-semibold text-ink-2">×{qty}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
