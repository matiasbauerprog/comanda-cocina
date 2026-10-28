import { useState } from 'react';
import { Search, Users, Merge, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clienteKey } from '../lib/pedidos';
import { suggestGroups, mergeGroup, matchesSearch, getDirecciones, findNameCollision } from '../lib/clientes';

const DISMISSED_KEY = 'gaspacho-unir-descartados';

function readDismissed() {
    try {
        const parsed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeDismissed(keys) {
    try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(keys));
    } catch {
        // Sin storage (modo privado): el descarte dura hasta recargar
    }
}

const inputClass = "w-full bg-surface border border-line-strong rounded-[9px] px-3 h-10 text-sm text-ink  focus:outline-none focus:border-ink-3 transition-all ";

// Formulario de unión para un conjunto de clientes. `candidatos` es la lista que se
// puede tildar; al cambiar los tildados se recalcula la propuesta (nombre editado se conserva).
function MergeCard({ candidatos, onDismiss, onDone }) {
    const { clientes, pedidos, unirClientes } = useStore();
    const [selectedIds, setSelectedIds] = useState(() => candidatos.map(c => c.id));
    const selected = candidatos.filter(c => selectedIds.includes(c.id));
    const [nombre, setNombre] = useState(() => mergeGroup(candidatos).nombre);
    const [etiquetas, setEtiquetas] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const propuesta = mergeGroup(selected);
    const direcciones = propuesta.direcciones.map(d => ({ ...d, etiqueta: etiquetas[d.direccion] ?? d.etiqueta }));
    const nombresKeys = propuesta.nombresViejos.map(clienteKey);
    const pedidosAfectados = pedidos.filter(p => nombresKeys.includes(clienteKey(p.cliente.nombre))).length;
    const collision = findNameCollision(clientes, selectedIds, nombre);
    const canMerge = selected.length >= 2 && nombre.trim() !== '' && !collision && !isSaving;

    const toggle = (id) =>
        setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

    const handleMerge = async () => {
        const final = nombre.trim();
        const ok = window.confirm(
            `Se unen ${selected.length} clientes en «${final}». ${pedidosAfectados} pedidos pasan a llamarse «${final}». No se puede deshacer.`
        );
        if (!ok) return;
        setIsSaving(true);
        const saved = await unirClientes({ ...propuesta, nombre: final, direcciones });
        setIsSaving(false);
        if (saved) onDone?.();
    };

    return (
        <div className="bg-surface rounded-2xl border border-line p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                {candidatos.map(c => (
                    <label key={c.id} className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={() => toggle(c.id)}
                            className="mt-1 w-4 h-4 accent-brand-navy"
                        />
                        <span className="min-w-0">
                            <span className="font-bold text-sm text-ink block">{c.nombre}</span>
                            {getDirecciones(c).map((d, i) => (
                                <span key={i} className="text-xs text-ink-3 block truncate">{d.etiqueta ? `${d.etiqueta} · ${d.direccion}` : d.direccion}</span>
                            ))}
                        </span>
                    </label>
                ))}
            </div>

            <div>
                <label className="block text-xs font-semibold text-ink-2 mb-1 ml-3">Nombre final</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} className={inputClass} />
            </div>

            {direcciones.length > 0 && (
                <div>
                    <span className="block text-xs font-semibold text-ink-2 mb-1 ml-3">Direcciones</span>
                    <div className="flex flex-col gap-1.5">
                        {direcciones.map(d => (
                            <div key={d.direccion} className="flex gap-2 items-center">
                                <input
                                    value={d.etiqueta}
                                    onChange={e => setEtiquetas(prev => ({ ...prev, [d.direccion]: e.target.value }))}
                                    placeholder="Etiqueta"
                                    className={`${inputClass} !w-28 shrink-0`}
                                />
                                <span className="text-sm text-ink-2 truncate">{d.direccion}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {collision && (
                <p className="text-xs font-bold text-danger">
                    Ya existe otro cliente llamado «{collision.nombre}» que no está en esta unión. Elegí otro nombre final
                    (por ejemplo con el apellido) para no mezclar sus pedidos.
                </p>
            )}

            <p className="text-xs text-ink-3">
                {pedidosAfectados} pedidos pasan a llamarse «{nombre.trim() || '…'}».
            </p>

            <div className="flex flex-wrap gap-2 justify-end">
                {onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="flex items-center gap-1.5 h-[38px] px-3.5 rounded-[9px] text-[13px] font-semibold text-ink-2 hover:bg-paper transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                        No son la misma persona
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleMerge}
                    disabled={!canMerge}
                    className="flex items-center gap-1.5 h-[38px] px-4 bg-brand-navy hover:bg-[#001A3A] text-white rounded-[9px] text-[13px] font-semibold cursor-pointer disabled:bg-line disabled:text-ink-4 disabled:cursor-not-allowed"
                >
                    <Merge className="w-4 h-4" />
                    {isSaving ? 'Uniendo...' : 'Unir'}
                </button>
            </div>
        </div>
    );
}

export default function UnirClientesView() {
    const { clientes } = useStore();
    const [dismissed, setDismissed] = useState(readDismissed);
    const [query, setQuery] = useState('');
    const [manualIds, setManualIds] = useState([]);

    const groups = suggestGroups(clientes, dismissed);
    const manualSelected = clientes.filter(c => manualIds.includes(c.id));
    const resultados = query.trim()
        ? clientes.filter(c => matchesSearch(query, c.nombre, ...getDirecciones(c).map(d => d.direccion)))
        : [];

    const dismiss = (key) => {
        const next = [...dismissed, key];
        setDismissed(next);
        writeDismissed(next);
    };

    const toggleManual = (id) =>
        setManualIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

    return (
        <div className="h-full overflow-y-auto px-4 pb-10">
            <div className="max-w-2xl mx-auto flex flex-col gap-8">
                <section className="flex flex-col gap-4">
                    <div>
                        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink">Clientes parecidos</h2>
                        <p className="text-sm text-ink-3">
                            Clientes cuyo nombre empieza igual. Si son la misma persona, unilos: queda uno solo con todas las direcciones.
                        </p>
                    </div>
                    {groups.length === 0 ? (
                        <p className="text-ink-3 italic text-sm text-center py-6">No hay clientes parecidos para revisar.</p>
                    ) : (
                        groups.map(g => (
                            // key con los ids: si el grupo cambia (se unió o se agregó alguien) el formulario se reinicia
                            <MergeCard
                                key={`${g.key}:${g.clientes.map(c => c.id).join(',')}`}
                                candidatos={g.clientes}
                                onDismiss={() => dismiss(g.key)}
                            />
                        ))
                    )}
                </section>

                <section className="flex flex-col gap-4">
                    <div>
                        <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink">Unir a mano</h2>
                        <p className="text-sm text-ink-3">Buscá y tildá los clientes que son la misma persona.</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-4" />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar cliente…"
                            className={`${inputClass} pl-10`}
                        />
                    </div>

                    {(resultados.length > 0 || manualSelected.length > 0) && (
                        <div className="flex flex-col gap-1">
                            {[...manualSelected, ...resultados.filter(c => !manualIds.includes(c.id))].map(c => (
                                <label key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-surface cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={manualIds.includes(c.id)}
                                        onChange={() => toggleManual(c.id)}
                                        className="w-4 h-4 accent-brand-navy"
                                    />
                                    <span className="font-bold text-sm text-ink">{c.nombre}</span>
                                    <span className="text-xs text-ink-3 truncate">{getDirecciones(c).map(d => d.direccion).join(' · ')}</span>
                                </label>
                            ))}
                        </div>
                    )}
                    {query.trim() && resultados.length === 0 && (
                        <p className="text-ink-3 italic text-sm">Sin resultados para «{query}»</p>
                    )}

                    {manualSelected.length >= 2 ? (
                        <MergeCard
                            key={manualIds.join(',')}
                            candidatos={manualSelected}
                            onDone={() => { setManualIds([]); setQuery(''); }}
                        />
                    ) : (
                        <p className="text-xs text-ink-3 flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            Tildá al menos 2 clientes para unirlos.
                        </p>
                    )}
                </section>
            </div>
        </div>
    );
}
