import { Plus, Trash2 } from 'lucide-react';

const inputClass = "bg-surface border border-line-strong rounded-[9px] px-3 h-9 text-sm text-ink focus:outline-none focus:border-ink-3 min-w-0";

// Lista editable de direcciones de un cliente: [{ etiqueta, direccion }].
export default function DireccionesEditor({ value, onChange }) {
    const update = (index, key, text) =>
        onChange(value.map((d, i) => (i === index ? { ...d, [key]: text } : d)));

    return (
        <div className="flex flex-col gap-1.5">
            {value.map((d, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                    <input
                        value={d.etiqueta}
                        onChange={e => update(i, 'etiqueta', e.target.value)}
                        placeholder="Casa"
                        className={`${inputClass} w-24 shrink-0`}
                    />
                    <input
                        value={d.direccion}
                        onChange={e => update(i, 'direccion', e.target.value)}
                        placeholder="Dirección"
                        className={`${inputClass} flex-1`}
                    />
                    <button
                        type="button"
                        onClick={() => onChange(value.filter((_, j) => j !== i))}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Quitar dirección"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => onChange([...value, { etiqueta: '', direccion: '' }])}
                className="self-start flex items-center gap-1 px-3 py-1 text-xs font-semibold text-ink-3 hover:text-brand-navy transition-colors cursor-pointer"
            >
                <Plus className="w-3 h-3" />
                Dirección
            </button>
        </div>
    );
}
