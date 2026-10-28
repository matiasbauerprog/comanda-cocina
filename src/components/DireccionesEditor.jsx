import { Plus, Trash2 } from 'lucide-react';

const inputClass = "bg-white border border-slate-200 rounded-full px-3 py-1.5 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-300 transition-all font-sans font-medium min-w-0";

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
                className="self-start flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-navy transition-colors cursor-pointer"
            >
                <Plus className="w-3 h-3" />
                Dirección
            </button>
        </div>
    );
}
