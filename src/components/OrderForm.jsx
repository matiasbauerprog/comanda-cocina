import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Minus, Send, X, Trash2, Edit3, Check, ChevronDown, Clock, Search } from 'lucide-react';

/* ───── Management Modal ───── */
function ManageModal({ title, items, onAdd, onDelete, onUpdate, onClose, fields }) {
    const [form, setForm] = useState(fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {}));
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const handleAdd = () => {
        const mainField = fields[0].key;
        if (!form[mainField]?.trim()) return;
        onAdd(form);
        setForm(fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {}));
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        const ef = {};
        fields.forEach(f => { ef[f.key] = item[f.key] || ''; });
        setEditForm(ef);
    };

    const saveEdit = () => {
        if (editingId && onUpdate) {
            onUpdate(editingId, editForm);
        }
        setEditingId(null);
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
                                                onClick={() => onDelete(item.id)}
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

/* ───── Custom Dropdown ───── */
function CustomDropdown({ placeholder, options, value, onChange, className, icon: Icon, iconMinus: IconMinus, iconPlus: IconPlus }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const [pendingQtys, setPendingQtys] = useState({});

    const hasQuantityControls = !!(IconMinus && IconPlus);
    const selectedOption = options.find(opt => opt.id === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        (opt.detail && opt.detail.toLowerCase().includes(search.toLowerCase()))
    );

    // Summary text for quantity mode
    const totalSelected = hasQuantityControls
        ? options.reduce((sum, opt) => sum + (opt.quantity || 0), 0)
        : 0;

    const getPendingQty = (optId) => pendingQtys[optId] ?? 1;

    const toggleOpen = () => {
        if (!isOpen) {
            setPendingQtys({});
            setSearch('');
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const inputBaseClass = "w-full bg-white/50 border border-slate-200/60 rounded-2xl px-5 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/10 focus:border-brand-navy/20 transition-all duration-300 font-sans font-medium hover:border-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-sm shadow-slate-200/20 flex items-center justify-between text-left transition-all duration-300";

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {isOpen ? (
                <div className={`${inputBaseClass} !bg-white !ring-2 !ring-brand-navy/10 !border-brand-navy/20`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Search className="w-4 h-4 text-brand-navy shrink-0" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar..."
                            className="bg-transparent border-none outline-none w-full p-0 text-sm font-medium text-slate-900 placeholder-slate-300"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-300 rotate-180 shrink-0" />
                </div>
            ) : (
                <button
                    type="button"
                    onClick={toggleOpen}
                    className={inputBaseClass}
                >
                    <div className="flex items-center gap-2 truncate">
                        {Icon ? <Icon className="w-4 h-4 text-slate-300 shrink-0" /> : <Search className="w-4 h-4 text-slate-200 shrink-0" />}
                        <span className={`truncate ${(!value && !hasQuantityControls) ? 'text-slate-300 font-medium' : (hasQuantityControls && totalSelected === 0) ? 'text-slate-300 font-medium' : hasQuantityControls ? 'text-slate-300 font-medium' : 'text-slate-900 font-bold'}`}>
                            {hasQuantityControls
                                ? (totalSelected > 0 ? `${totalSelected} plato${totalSelected > 1 ? 's' : ''} seleccionado${totalSelected > 1 ? 's' : ''}` : placeholder)
                                : (selectedOption ? selectedOption.label : placeholder)
                            }
                        </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
            )}

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-[100] bg-white border border-slate-100 rounded-[2rem] shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top flex flex-col">
                    {filteredOptions.length === 0 ? (
                        <div className="px-4 py-8 text-xs text-slate-300 text-center italic">No se encontraron resultados</div>
                    ) : (
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            {filteredOptions.map((opt) => {
                                const pendingQty = hasQuantityControls ? getPendingQty(opt.id) : 0;
                                return (
                                    <div
                                        key={opt.id}
                                        className={`w-full text-left px-5 py-3 text-sm transition-colors flex items-center justify-between gap-2 cursor-pointer
                                        ${hasQuantityControls
                                                ? (opt.quantity > 0 ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50/80')
                                                : (value === opt.id ? 'bg-slate-50 text-slate-900' : 'text-slate-600 hover:bg-slate-50/80')
                                            }
                                    `}
                                        onClick={() => {
                                            if (hasQuantityControls) {
                                                onChange(opt.id, pendingQty);
                                            } else {
                                                onChange(opt.id);
                                            }
                                            setIsOpen(false);
                                        }}
                                    >
                                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                            <span className="font-bold truncate">{opt.label}</span>
                                            {opt.detail && <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{opt.detail}</span>}
                                        </div>

                                        {/* Quantity Control — local pending qty */}
                                        {hasQuantityControls && (
                                            <div className="flex items-center gap-1 bg-slate-100 rounded-full px-1 py-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPendingQtys(prev => ({ ...prev, [opt.id]: Math.max(1, pendingQty - 1) }));
                                                    }}
                                                    className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
                                                >
                                                    <IconMinus className="w-3 h-3" />
                                                </button>
                                                <span className={`text-[11px] font-black w-5 text-center ${pendingQty > 1 ? 'text-slate-700' : 'text-slate-400'}`}>{pendingQty}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPendingQtys(prev => ({ ...prev, [opt.id]: pendingQty + 1 }));
                                                    }}
                                                    className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
                                                >
                                                    <IconPlus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const METODOS_PAGO = [
    { id: 'Efectivo' },
    { id: 'Tarjeta' }
];

/* ───── Order Form ───── */
export default function OrderForm() {
    const { addPedido, platos, clientes, addPlato, updatePlato, deletePlato, addCliente, updateCliente, deleteCliente } = useStore();

    // Selected values
    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [direccion, setDireccion] = useState('');
    const [selectedPlatos, setSelectedPlatos] = useState([]); // [{platoId, nombre, monto}]
    const [horarioEntrega, setHorarioEntrega] = useState('');
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [observaciones, setObservaciones] = useState('');
    const [flash, setFlash] = useState(false);
    const [showClientesModal, setShowClientesModal] = useState(false);
    const [showPlatosModal, setShowPlatosModal] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const clienteRef = useRef(null);
    const timeInputRef = useRef(null);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsExpanded(true);
        };

        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        setIsExpanded(!mobile); // Default collapsed on mobile

        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Shortcut for new order (F2)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                if (!isExpanded) setIsExpanded(true);
                setTimeout(() => clienteRef.current?.focus(), 100);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isExpanded]);

    const toggleExpand = () => {
        if (isMobile) {
            setIsExpanded(!isExpanded);
        }
    };

    // When selecting a client, pre-fill their address
    const handleClienteSelect = (id) => {
        setSelectedClienteId(id);
        if (id) {
            const c = clientes.find(c => c.id === id);
            if (c) setDireccion(c.direccion || '');
        } else {
            setDireccion('');
        }
    };

    // Dish management
    const addDishToOrder = (platoId, qty = 1) => {
        const p = platos.find(p => p.id === platoId);
        if (p) {
            setSelectedPlatos(prev => [...prev, { platoId: p.id, nombre: p.nombre, monto: p.monto, cantidad: qty }]);
        }
    };

    const removeDishFromOrder = (index) => {
        setSelectedPlatos(prev => prev.filter((_, i) => i !== index));
    };

    const updateDishPrice = (index, newMonto) => {
        // Allow empty string or numeric value to facilitate typing
        setSelectedPlatos(prev => prev.map((d, i) => i === index ? { ...d, monto: newMonto } : d));
    };

    const updateDishQuantity = (index, newCant) => {
        setSelectedPlatos(prev => prev.map((d, i) => i === index ? { ...d, cantidad: parseInt(newCant) || 1 } : d));
    };

    const totalMonto = selectedPlatos.reduce((sum, d) => sum + (parseFloat(d.monto) || 0) * (d.cantidad || 1), 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        const cliente = clientes.find(c => c.id === selectedClienteId);
        if (!cliente || selectedPlatos.length === 0) return;

        const pedidoText = selectedPlatos.map(d => {
            const qty = d.cantidad > 1 ? `(${d.cantidad}) ` : '';
            return `${qty}${d.nombre}`;
        }).join(', ');

        addPedido({
            nombre: cliente.nombre,
            direccion: direccion.trim(),
            pedido: pedidoText,
            horario_entrega: horarioEntrega,
            metodo_pago: metodoPago,
            observaciones,
            monto: totalMonto,
        });

        // Reset
        setSelectedClienteId('');
        setDireccion('');
        setSelectedPlatos([]);
        setHorarioEntrega('');
        setMetodoPago('Efectivo');
        setObservaciones('');
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
        clienteRef.current?.focus();
    };

    const inputClass = "w-full bg-white/50 border border-slate-200/60 rounded-2xl px-5 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/10 focus:border-brand-navy/20 transition-all duration-300 font-sans font-medium hover:border-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-sm shadow-slate-200/20";
    const labelClass = "block text-[11px] font-black text-brand-navy/70 uppercase tracking-widest mb-2 font-display";

    return (
        <div className="group/form relative">
            <form
                onSubmit={handleSubmit}
                className={`bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-[0_8px_40px_rgba(0,40,85,0.06)] flex flex-col relative transition-all duration-500 ${flash ? 'ring-4 ring-brand-navy/10 border-brand-navy/20' : ''} ${isExpanded ? 'p-8 lg:p-10 gap-8' : 'p-4 gap-0'}`}
            >
                {/* Header */}
                <div
                    className={`flex items-center transition-all cursor-pointer lg:cursor-default relative ${isExpanded ? 'justify-between mb-2' : 'justify-center'} ${!isMobile ? 'lg:justify-start lg:mb-0' : ''}`}
                    onClick={toggleExpand}
                >
                    <h2 className="text-[32px] font-display font-black text-brand-navy tracking-tighter leading-none mb-4">
                        Nuevo Pedido
                    </h2>
                    {/* Mobile Chevron */}
                    <div className={`lg:hidden text-slate-400 ${!isExpanded ? 'absolute right-4' : ''}`}>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} />
                    </div>
                </div>

                {isExpanded && (
                    <div className="flex flex-col gap-6">
                        <div className="space-y-4">
                            {/* Row 1: Cliente (select) + Dirección */}
                            <div className="grid grid-cols-[1fr,1.2fr] gap-4 items-end">
                                <div>
                                    <div className="flex items-center justify-start gap-1 mb-1 flex-nowrap">
                                        <label className={`${labelClass} !mb-0 whitespace-nowrap`}>Cliente</label>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setShowClientesModal(true); }} className="text-[10px] font-bold text-slate-300 hover:text-slate-500 transition-colors cursor-pointer uppercase tracking-tighter whitespace-nowrap">
                                            (AGREGAR O QUITAR)
                                        </button>
                                    </div>
                                    <CustomDropdown
                                        placeholder="Seleccionar clien..."
                                        value={selectedClienteId}
                                        onChange={handleClienteSelect}
                                        options={clientes.map(c => ({
                                            id: c.id,
                                            label: c.nombre,
                                            detail: c.direccion
                                        }))}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <input
                                        value={direccion}
                                        onChange={e => setDireccion(e.target.value)}
                                        placeholder="Dirección de entrega"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Row 2: Pedido */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-start gap-1 mb-1 flex-nowrap">
                                    <label className={`${labelClass} !mb-0 whitespace-nowrap`}>Pedido</label>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setShowPlatosModal(true); }} className="text-[10px] font-bold text-slate-300 hover:text-slate-500 transition-colors cursor-pointer uppercase tracking-tighter whitespace-nowrap">
                                        (AGREGAR O QUITAR)
                                    </button>
                                </div>

                                {selectedPlatos.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {selectedPlatos.map((d, i) => (
                                            <div key={i} className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-full pl-2 pr-4 py-1.5 shadow-sm transition-all hover:border-slate-300 group/chip">
                                                {/* Quantity Control */}
                                                <div className="flex items-center gap-1 bg-slate-100 rounded-full px-1 py-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateDishQuantity(i, Math.max(1, (d.cantidad || 1) - 1))}
                                                        className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-[11px] font-black text-slate-700 w-5 text-center">{d.cantidad || 1}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateDishQuantity(i, (d.cantidad || 1) + 1)}
                                                        className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>

                                                <span className="text-[12px] font-bold text-slate-700 tracking-tight">{d.nombre}</span>

                                                <div className="flex items-center gap-1.5 border-l border-slate-100 pl-3 bg-slate-50/50 rounded-r-full -mr-4 pr-4 py-1.5 group-hover/chip:bg-brand-navy/[0.03] transition-colors">
                                                    <span className="text-[10px] text-brand-navy/30 font-black">$</span>
                                                    <input
                                                        type="number"
                                                        value={d.monto}
                                                        onChange={e => updateDishPrice(i, e.target.value)}
                                                        className="w-16 bg-transparent text-[13px] font-black text-brand-navy focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-slate-300"
                                                        min="0"
                                                        step="any"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <button type="button" onClick={() => removeDishFromOrder(i)} className="p-1 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-full transition-colors cursor-pointer ml-1">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <CustomDropdown
                                    placeholder="Seleccionar platos..."
                                    value=""
                                    onChange={(id, qty) => {
                                        const inOrder = selectedPlatos.find(sp => sp.platoId === id);
                                        if (inOrder) {
                                            const idx = selectedPlatos.indexOf(inOrder);
                                            updateDishQuantity(idx, (inOrder.cantidad || 0) + qty);
                                        } else {
                                            addDishToOrder(id, qty);
                                        }
                                    }}
                                    iconMinus={Minus}
                                    iconPlus={Plus}
                                    options={platos.map(p => {
                                        const inOrder = selectedPlatos.find(sp => sp.platoId === p.id);
                                        const qty = inOrder ? (inOrder.cantidad || 1) : 0;
                                        return {
                                            id: p.id,
                                            label: p.nombre,
                                            detail: `$${Number(p.monto).toLocaleString('es-AR')}`,
                                            quantity: qty,
                                        };
                                    })}
                                    className={inputClass}
                                />
                            </div>

                            {/* Row 3: Pago + Total */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 pt-2">
                                <div className="flex flex-col items-center w-full sm:w-auto">
                                    <label className={`${labelClass} text-center w-full mb-3`}>MÉTODO DE PAGO</label>
                                    <div className="flex bg-slate-50/50 p-1 rounded-full border border-slate-100 min-w-[200px]">
                                        {METODOS_PAGO.map(m => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setMetodoPago(m.id)}
                                                className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center justify-center ${metodoPago === m.id
                                                    ? (m.id === 'Tarjeta' ? 'bg-brand-navy text-white shadow-lg shadow-brand-navy/30' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30')
                                                    : 'text-slate-400 hover:text-brand-navy hover:bg-white'
                                                    }`}
                                            >
                                                {m.id}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col items-center sm:items-end pr-4">
                                    <label className={`${labelClass} text-center sm:text-right mb-3`}>TOTAL</label>
                                    <div className={`text-[40px] font-display font-black tracking-tighter leading-none h-12 flex items-center ${metodoPago === 'Tarjeta' ? 'text-brand-navy' : 'text-emerald-600'}`}>
                                        ${totalMonto.toLocaleString('es-AR')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex gap-4 items-center">
                                <div className="flex-1">
                                    <input
                                        value={observaciones}
                                        onChange={e => setObservaciones(e.target.value)}
                                        placeholder="Observaciones"
                                        className="w-full bg-transparent border-b border-slate-200 py-3 text-sm text-slate-900 placeholder-slate-900 focus:outline-none focus:border-[#55b685] transition-all font-sans font-medium"
                                    />
                                </div>
                                <div className="flex flex-col items-center">
                                    <div
                                        onClick={() => timeInputRef.current?.showPicker()}
                                        className="flex items-center justify-center bg-white/50 rounded-2xl px-4 h-12 border border-slate-200/60 hover:border-brand-navy/20 hover:bg-white transition-all cursor-pointer group/time min-w-[100px] shadow-sm shadow-slate-200/20"
                                    >
                                        <span className={`font-black text-[10px] uppercase tracking-widest ${horarioEntrega ? 'text-brand-navy' : 'text-slate-500'}`}>
                                            {horarioEntrega || "HORA"}
                                        </span>
                                        <input
                                            ref={timeInputRef}
                                            type="time"
                                            value={horarioEntrega}
                                            onChange={e => setHorarioEntrega(e.target.value)}
                                            className="w-0 h-0 opacity-0 absolute"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center pt-2">
                                <button
                                    type="submit"
                                    disabled={!selectedClienteId || selectedPlatos.length === 0}
                                    className="w-full max-w-sm h-14 bg-gradient-to-r from-brand-red to-[#ff4d4d] hover:from-[#e60000] hover:to-[#ff3333] text-white font-display font-black text-sm tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer shadow-xl shadow-brand-red/30 disabled:opacity-30 disabled:grayscale disabled:shadow-none duration-300 uppercase"
                                >
                                    <Send className="w-5 h-5" />
                                    DESPACHAR
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </form>

            {showClientesModal && (
                <ManageModal
                    title="Gestionar Clientes"
                    items={clientes}
                    onAdd={(data) => addCliente({ nombre: data.nombre, direccion: data.direccion })}
                    onDelete={deleteCliente}
                    onUpdate={updateCliente}
                    onClose={() => setShowClientesModal(false)}
                    fields={[
                        { key: 'nombre', label: 'Nombre', placeholder: 'Nombre del cliente', grow: true },
                        { key: 'direccion', label: 'Dirección', placeholder: 'Dirección', grow: true },
                    ]}
                />
            )}

            {showPlatosModal && (
                <ManageModal
                    title="Gestionar Platos"
                    items={platos}
                    onAdd={(data) => addPlato({ nombre: data.nombre, monto: data.monto })}
                    onDelete={deletePlato}
                    onUpdate={updatePlato}
                    onClose={() => setShowPlatosModal(false)}
                    fields={[
                        { key: 'nombre', label: 'Nombre', placeholder: 'Nombre del plato', grow: true },
                        { key: 'monto', label: 'Precio', placeholder: '0', type: 'number' },
                    ]}
                />
            )}
        </div>
    );
}
