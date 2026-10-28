import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Minus, Send, X, ChevronDown } from 'lucide-react';
import ManageModal from './ManageModal';
import CustomDropdown from './CustomDropdown';
import { useIsMobile, isMobileViewport } from '../hooks/useIsMobile';
import { formatPedidoText } from '../lib/pedidos';
import { getDirecciones, direccionLabel, hasDireccion, addDireccion } from '../lib/clientes';
import DireccionesEditor from './DireccionesEditor';

const METODOS_PAGO = [
    { id: 'Efectivo' },
    { id: 'Tarjeta' }
];

// Gestión de clientes: cada cliente tiene una lista de direcciones.
const CLIENTE_DIRECCIONES_FIELD = {
    key: 'direcciones',
    empty: [{ etiqueta: '', direccion: '' }],
    fromItem: getDirecciones,
    render: (value, onChange) => <DireccionesEditor value={value} onChange={onChange} />,
};

function renderClienteDirecciones(cliente) {
    return getDirecciones(cliente).map((d, i) => (
        <span key={i} className="text-xs text-gray-400 truncate block">
            {d.etiqueta && <strong className="text-gray-500">{d.etiqueta} · </strong>}
            {d.direccion}
        </span>
    ));
}

function clienteSearchTexts(cliente) {
    return [cliente.nombre, ...getDirecciones(cliente).flatMap(d => [d.etiqueta, d.direccion])];
}

/* ───── Order Form ───── */
export default function OrderForm() {
    const { addPedido, platos, clientes, addPlato, updatePlato, deletePlato, addCliente, updateCliente, deleteCliente } = useStore();

    // Selected values
    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [isSavingDireccion, setIsSavingDireccion] = useState(false);
    const [direccion, setDireccion] = useState('');
    const [selectedPlatos, setSelectedPlatos] = useState([]); // [{platoId, nombre, monto}]
    const [horarioEntrega, setHorarioEntrega] = useState('');
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [observaciones, setObservaciones] = useState('');
    const [flash, setFlash] = useState(false);
    const [showClientesModal, setShowClientesModal] = useState(false);
    const [showPlatosModal, setShowPlatosModal] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const isMobile = useIsMobile();
    // En mobile arranca colapsado; en desktop siempre está expandido
    const [isExpandedMobile, setIsExpandedMobile] = useState(() => !isMobileViewport());
    const isExpanded = !isMobile || isExpandedMobile;
    const clienteRef = useRef(null);
    const timeInputRef = useRef(null);

    // Shortcut for new order (F2)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                setIsExpandedMobile(true);
                setTimeout(() => clienteRef.current?.focus(), 100);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleExpand = () => {
        if (isMobile) setIsExpandedMobile(!isExpandedMobile);
    };

    // When selecting a client, pre-fill their address
    const handleClienteSelect = (id) => {
        setSelectedClienteId(id);
        if (id) {
            const c = clientes.find(c => c.id === id);
            if (c) setDireccion(getDirecciones(c)[0]?.direccion ?? '');
        } else {
            setDireccion('');
        }
    };

    const selectedCliente = clientes.find(c => c.id === selectedClienteId);
    const clienteDirecciones = selectedCliente ? getDirecciones(selectedCliente) : [];
    const canSaveDireccion = !!selectedCliente && direccion.trim() !== '' && !hasDireccion(clienteDirecciones, direccion);

    const saveDireccion = async () => {
        setIsSavingDireccion(true);
        await updateCliente(selectedCliente.id, {
            nombre: selectedCliente.nombre,
            direcciones: addDireccion(clienteDirecciones, direccion),
        });
        setIsSavingDireccion(false);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cliente = selectedCliente;
        if (!cliente || selectedPlatos.length === 0 || isSending) return;

        setIsSending(true);
        const ok = await addPedido({
            nombre: cliente.nombre,
            direccion: direccion.trim(),
            pedido: formatPedidoText(selectedPlatos),
            horario_entrega: horarioEntrega,
            metodo_pago: metodoPago,
            observaciones,
            monto: totalMonto,
        });
        setIsSending(false);
        // Si falló se conservan los datos cargados para poder reintentar
        if (!ok) return;

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
                                        ref={clienteRef}
                                        placeholder="Seleccionar clien..."
                                        value={selectedClienteId}
                                        onChange={handleClienteSelect}
                                        options={clientes.map(c => ({
                                            id: c.id,
                                            label: c.nombre,
                                            detail: getDirecciones(c).map(d => d.direccion).join(' · ')
                                        }))}
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

                            {/* Direcciones guardadas del cliente */}
                            {(clienteDirecciones.length > 0 || canSaveDireccion) && (
                                <div className="flex flex-wrap gap-2 -mt-1">
                                    {clienteDirecciones.map((d, i) => {
                                        const isActive = hasDireccion([d], direccion);
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setDireccion(d.direccion)}
                                                title={d.direccion}
                                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer max-w-[14rem] truncate ${isActive
                                                    ? 'bg-brand-navy text-white shadow-md shadow-brand-navy/20'
                                                    : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-brand-navy'
                                                    }`}
                                            >
                                                {direccionLabel(d)}
                                            </button>
                                        );
                                    })}
                                    {canSaveDireccion && (
                                        <button
                                            type="button"
                                            onClick={saveDireccion}
                                            disabled={isSavingDireccion}
                                            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-dashed border-slate-300 text-slate-500 hover:text-brand-navy hover:border-brand-navy/40 transition-all cursor-pointer disabled:opacity-50"
                                        >
                                            <Plus className="w-3 h-3" />
                                            {isSavingDireccion ? 'Guardando...' : 'Guardar en el cliente'}
                                        </button>
                                    )}
                                </div>
                            )}

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
                                    disabled={!selectedClienteId || selectedPlatos.length === 0 || isSending}
                                    className="w-full max-w-sm h-14 bg-gradient-to-r from-brand-red to-[#ff4d4d] hover:from-[#e60000] hover:to-[#ff3333] text-white font-display font-black text-sm tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer shadow-xl shadow-brand-red/30 disabled:opacity-30 disabled:grayscale disabled:shadow-none duration-300 uppercase"
                                >
                                    <Send className="w-5 h-5" />
                                    {isSending ? 'ENVIANDO...' : 'DESPACHAR'}
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
                    onAdd={addCliente}
                    onDelete={deleteCliente}
                    onUpdate={updateCliente}
                    onClose={() => setShowClientesModal(false)}
                    fields={[
                        { key: 'nombre', label: 'Nombre', placeholder: 'Nombre del cliente', grow: true },
                    ]}
                    extraField={CLIENTE_DIRECCIONES_FIELD}
                    renderDetail={renderClienteDirecciones}
                    getSearchTexts={clienteSearchTexts}
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
