import { useState } from 'react';
import { X, Trash2, Edit3, Check } from 'lucide-react';

function emptyForm(fields) {
    return fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});
}

// Modal para dar de alta, editar y borrar registros simples (clientes, platos).
// onAdd / onUpdate devuelven true si se guardó, para saber si limpiar el formulario.
export default function ManageModal({ title, items, onAdd, onDelete, onUpdate, onClose, fields }) {
    const [form, setForm] = useState(() => emptyForm(fields));
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const handleAdd = async () => {
        const mainField = fields[0].key;
        if (!form[mainField]?.trim()) return;
        if (await onAdd(form)) setForm(emptyForm(fields));
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        const ef = {};
        fields.forEach(f => { ef[f.key] = item[f.key] || ''; });
        setEditForm(ef);
    };

    const saveEdit = async () => {
        if (await onUpdate(editingId, editForm)) setEditingId(null);
    };

    const handleDelete = (item) => {
        if (window.confirm(`¿Eliminar "${item.nombre}"?`)) onDelete(item.id);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden animate-card-in" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-display font-bold uppercase tracking-wide text-gray-800">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Add Form */}
                <div className="px-5 py-4 border-b border-gray-100 bg-white">
                    <div className="flex gap-2 items-end">
                        {fields.map(f => (
                            <div key={f.key} className={f.grow ? 'flex-1' : 'w-24'}>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-3">{f.label}</label>
                                <input
                                    value={form[f.key]}
                                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                    placeholder={f.placeholder}
                                    type={f.type || 'text'}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:border-slate-300 transition-all font-sans font-medium"
                                />
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="px-6 py-2 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shrink-0 shadow-lg shadow-brand-navy/20 active:scale-95"
                        >
                            AGREGAR
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 p-4 space-y-2">
                    {items.length === 0 ? (
                        <p className="text-gray-400 text-center py-8 italic text-sm">No hay registros</p>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 hover:border-gray-200 transition-colors">
                                {editingId === item.id ? (
                                    /* Edit mode */
                                    <div className="flex gap-2 items-end flex-wrap">
                                        {fields.map(f => (
                                            <div key={f.key} className={f.grow ? 'flex-1 min-w-[80px]' : 'w-24'}>
                                                <input
                                                    value={editForm[f.key]}
                                                    onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                    onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                                    type={f.type || 'text'}
                                                    className="w-full bg-white border border-[#55b685] rounded-full px-4 py-1.5 text-sm text-slate-900 focus:outline-none font-sans font-medium"
                                                />
                                            </div>
                                        ))}
                                        <div className="flex gap-1">
                                            <button type="button" onClick={saveEdit} className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors cursor-pointer">
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button type="button" onClick={() => setEditingId(null)} className="p-1.5 bg-gray-200 text-gray-500 hover:bg-gray-300 rounded-lg transition-colors cursor-pointer">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* View mode */
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <span className="font-bold text-gray-900 text-sm block truncate">{item.nombre}</span>
                                            {item.direccion && <span className="text-xs text-gray-400 truncate block">{item.direccion}</span>}
                                            {item.monto !== undefined && <span className="text-xs font-display font-bold text-gray-500">${Number(item.monto).toLocaleString('es-AR')}</span>}
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => startEdit(item)}
                                                className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
