import { useState } from 'react';
import { X, Trash2, Pencil, Check, Search, Plus } from 'lucide-react';
import Modal from './ui/Modal';
import { matchesSearch } from '../lib/clientes';

const defaultSearchTexts = (item) => [item.nombre];

const inputClass = "w-full h-10 bg-surface border border-line-strong rounded-[9px] px-3 text-sm text-ink focus:outline-none focus:border-ink-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

function emptyForm(fields, extraField) {
    const form = fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});
    if (extraField) form[extraField.key] = extraField.empty;
    return form;
}

// Modal para dar de alta, editar y borrar registros simples (clientes, platos).
// onAdd / onUpdate devuelven true si se guardó, para saber si limpiar el formulario.
// extraField agrega un campo con editor propio (ej. las direcciones de un cliente) y
// renderDetail reemplaza la línea de detalle de cada registro.
export default function ManageModal({ title, items, onAdd, onDelete, onUpdate, onClose, fields, extraField, renderDetail, getSearchTexts = defaultSearchTexts }) {
    const [query, setQuery] = useState('');
    const [form, setForm] = useState(() => emptyForm(fields, extraField));
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const handleAdd = async () => {
        const mainField = fields[0].key;
        if (!form[mainField]?.trim()) return;
        if (await onAdd(form)) setForm(emptyForm(fields, extraField));
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        const ef = {};
        fields.forEach(f => { ef[f.key] = item[f.key] || ''; });
        if (extraField) ef[extraField.key] = extraField.fromItem(item);
        setEditForm(ef);
    };

    const saveEdit = async () => {
        if (await onUpdate(editingId, editForm)) setEditingId(null);
    };

    const handleDelete = (item) => {
        if (window.confirm(`¿Eliminar "${item.nombre}"?`)) onDelete(item.id);
    };

    const visibleItems = items.filter(item => matchesSearch(query, ...getSearchTexts(item)));

    return (
        <Modal title={title} onClose={onClose} maxWidth="max-w-md">
            {/* Alta */}
            <div className="px-5 py-4 border-b border-line-soft">
                <div className="flex gap-2 items-end">
                    {fields.map(f => (
                        <label key={f.key} className={`flex flex-col gap-1.5 ${f.grow ? 'flex-1 min-w-0' : 'w-24'}`}>
                            <span className="text-xs font-semibold text-ink-2">{f.label}</span>
                            <input
                                value={form[f.key]}
                                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                placeholder={f.placeholder}
                                type={f.type || 'text'}
                                className={inputClass}
                            />
                        </label>
                    ))}
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="h-10 px-4 bg-brand-navy hover:bg-[#001A3A] text-white rounded-[9px] text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar
                    </button>
                </div>
                {extraField && (
                    <div className="mt-2.5">
                        {extraField.render(form[extraField.key], v => setForm(prev => ({ ...prev, [extraField.key]: v })))}
                    </div>
                )}
            </div>

            {/* Buscador */}
            {items.length > 0 && (
                <div className="px-5 pt-3">
                    <div className="flex items-center gap-2.5 h-10 px-3.5 rounded-[9px] bg-soft border border-line-soft">
                        <Search className="w-4 h-4 text-ink-4 shrink-0" />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar…"
                            className="flex-1 min-w-0 h-full bg-transparent text-sm text-ink focus:outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Lista */}
            <div className="p-3 flex flex-col">
                {items.length === 0 ? (
                    <p className="text-ink-3 text-center py-8 text-sm">No hay registros</p>
                ) : visibleItems.length === 0 ? (
                    <p className="text-ink-3 text-center py-8 text-sm">Sin resultados para «{query}»</p>
                ) : (
                    visibleItems.map(item => (
                        <div key={item.id} className="px-2.5 py-2.5 border-b border-line-soft last:border-b-0">
                            {editingId === item.id ? (
                                <div className="flex gap-2 items-center flex-wrap">
                                    {fields.map(f => (
                                        <div key={f.key} className={f.grow ? 'flex-1 min-w-[80px]' : 'w-24'}>
                                            <input
                                                value={editForm[f.key]}
                                                onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                                type={f.type || 'text'}
                                                className={`${inputClass} border-brand-navy/40`}
                                            />
                                        </div>
                                    ))}
                                    <div className="flex gap-1">
                                        <button type="button" onClick={saveEdit} className="w-9 h-9 rounded-[9px] bg-brand-navy text-white flex items-center justify-center cursor-pointer" title="Guardar">
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button type="button" onClick={() => setEditingId(null)} className="w-9 h-9 rounded-[9px] bg-paper text-ink-2 hover:bg-track flex items-center justify-center cursor-pointer" title="Cancelar">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {extraField && (
                                        <div className="basis-full">
                                            {extraField.render(editForm[extraField.key], v => setEditForm(prev => ({ ...prev, [extraField.key]: v })))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <span className="font-semibold text-ink text-sm block truncate">{item.nombre}</span>
                                        {renderDetail ? renderDetail(item) : (
                                            <>
                                                {item.direccion && <span className="text-xs text-ink-3 truncate block">{item.direccion}</span>}
                                                {item.monto !== undefined && <span className="font-mono text-xs text-ink-2">${Number(item.monto).toLocaleString('es-AR')}</span>}
                                            </>
                                        )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button type="button" onClick={() => startEdit(item)} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:bg-paper hover:text-ink cursor-pointer" title="Editar">
                                            <Pencil className="w-[15px] h-[15px]" />
                                        </button>
                                        <button type="button" onClick={() => handleDelete(item)} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:bg-danger-bg hover:text-danger cursor-pointer" title="Eliminar">
                                            <Trash2 className="w-[15px] h-[15px]" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
}
