import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Minus, Send, X, ChevronDown, Banknote, CreditCard } from 'lucide-react';
import ManageModal from './ManageModal';
import ClientePicker from './order/ClientePicker';
import PlatoPicker from './order/PlatoPicker';
import { useToast } from './ui/Toast';
import { useIsMobile, isMobileViewport } from '../hooks/useIsMobile';
import { formatPedidoText } from '../lib/pedidos';
import { getDirecciones, addDireccion } from '../lib/clientes';
import { addLine } from '../lib/orderForm';
import { formatMoney } from '../lib/format';
import DireccionesEditor from './DireccionesEditor';

const METODOS_PAGO = [
    { id: 'Efectivo', label: 'Efectivo', icon: Banknote },
    { id: 'Tarjeta', label: 'Tarjeta', icon: CreditCard },
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
        <span key={i} className="text-xs text-ink-3 truncate block">
            {d.etiqueta && <strong className="text-ink-2 font-semibold">{d.etiqueta} · </strong>}
            {d.direccion}
        </span>
    ));
}

function clienteSearchTexts(cliente) {
    return [cliente.nombre, ...getDirecciones(cliente).flatMap(d => [d.etiqueta, d.direccion])];
}

const fieldClass = "h-[42px] border border-line-strong rounded-[10px] px-3 text-sm text-ink bg-surface focus:outline-none focus:border-ink-3";

/* ───── Nuevo pedido ───── */
export default function OrderForm() {
    const { addPedido, platos, clientes, masPedidos, addPlato, updatePlato, deletePlato, addCliente, updateCliente, deleteCliente } = useStore();
    const toast = useToast();

    const [selectedClienteId, setSelectedClienteId] = useState('');
    const [isSavingDireccion, setIsSavingDireccion] = useState(false);
    const [direccion, setDireccion] = useState('');
    const [lines, setLines] = useState([]); // [{ platoId, nombre, monto, cantidad }]
    const [horarioEntrega, setHorarioEntrega] = useState('');
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [observaciones, setObservaciones] = useState('');
    const [showClientesModal, setShowClientesModal] = useState(false);
    const [showPlatosModal, setShowPlatosModal] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const isMobile = useIsMobile();
    // En mobile arranca colapsado; en desktop siempre está expandido
    const [isExpandedMobile, setIsExpandedMobile] = useState(() => !isMobileViewport());
    const isExpanded = !isMobile || isExpandedMobile;
    const clienteRef = useRef(null);

    // Atajo para un pedido nuevo (F2)
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

    const selectedCliente = clientes.find(c => c.id === selectedClienteId);

    // Al elegir un cliente se precarga su primera dirección
    const handleClienteSelect = (id) => {
        setSelectedClienteId(id || '');
        const c = id ? clientes.find(c => c.id === id) : null;
        setDireccion(c ? getDirecciones(c)[0]?.direccion ?? '' : '');
        if (!id) setTimeout(() => clienteRef.current?.focus(), 0);
    };

    const saveDireccion = async () => {
        setIsSavingDireccion(true);
        await updateCliente(selectedCliente.id, {
            nombre: selectedCliente.nombre,
            direcciones: addDireccion(getDirecciones(selectedCliente), direccion),
        });
        setIsSavingDireccion(false);
    };

    const updateLine = (index, patch) =>
        setLines(prev => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));

    const totalMonto = lines.reduce((sum, l) => sum + (parseFloat(l.monto) || 0) * (l.cantidad || 1), 0);
    const canSubmit = !!selectedCliente && lines.length > 0 && !isSending;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        setIsSending(true);
        const ok = await addPedido({
            nombre: selectedCliente.nombre,
            direccion: direccion.trim(),
            pedido: formatPedidoText(lines),
            horario_entrega: horarioEntrega,
            metodo_pago: metodoPago,
            observaciones,
            monto: totalMonto,
        });
        setIsSending(false);
        // Si falló se conservan los datos cargados para poder reintentar
        if (!ok) return;

        toast(`Pedido de ${selectedCliente.nombre} enviado a cocina`);
        setSelectedClienteId('');
        setDireccion('');
        setLines([]);
        setHorarioEntrega('');
        setMetodoPago('Efectivo');
        setObservaciones('');
        setTimeout(() => clienteRef.current?.focus(), 0);
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-[18px] flex flex-col overflow-hidden">
                <div
                    className={`px-[22px] pt-5 flex items-center justify-between ${isExpanded ? '' : 'pb-5'} ${isMobile ? 'cursor-pointer' : ''}`}
                    onClick={() => isMobile && setIsExpandedMobile(v => !v)}
                >
                    <h2 className="font-display font-bold text-2xl tracking-[-0.025em] text-ink">Nuevo pedido</h2>
                    {isMobile ? (
                        <ChevronDown className={`w-5 h-5 text-ink-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    ) : (
                        <span className="flex items-center gap-1.5 text-xs text-ink-3">
                            Atajo
                            <kbd className="font-mono text-[11px] px-1.5 py-0.5 border border-line-strong border-b-2 rounded-[5px] bg-soft text-ink">F2</kbd>
                        </span>
                    )}
                </div>

                {isExpanded && (
                    <>
                        <div className="px-[22px] py-[18px] flex flex-col gap-5">
                            <ClientePicker
                                ref={clienteRef}
                                clientes={clientes}
                                cliente={selectedCliente}
                                onSelect={handleClienteSelect}
                                direccion={direccion}
                                onDireccion={setDireccion}
                                onSaveDireccion={saveDireccion}
                                isSavingDireccion={isSavingDireccion}
                                onManage={() => setShowClientesModal(true)}
                            />

                            <div className="flex flex-col gap-2">
                                <PlatoPicker
                                    platos={platos}
                                    lines={lines}
                                    masPedidos={masPedidos}
                                    onAdd={plato => setLines(prev => addLine(prev, plato))}
                                    onManage={() => setShowPlatosModal(true)}
                                />

                                {lines.length > 0 && (
                                    <div className="mt-1 border border-line-soft rounded-xl bg-soft">
                                        {lines.map((l, i) => (
                                            <div key={l.platoId} className="flex items-center gap-2.5 px-2.5 py-2 border-b border-line-soft last:border-b-0">
                                                <div className="flex items-center bg-surface border border-line rounded-lg h-7 shrink-0">
                                                    <button type="button" onClick={() => updateLine(i, { cantidad: Math.max(1, l.cantidad - 1) })} className="w-[26px] h-[26px] flex items-center justify-center text-ink-2 cursor-pointer" title="Uno menos">
                                                        <Minus className="w-[13px] h-[13px]" />
                                                    </button>
                                                    <span className="font-mono text-[13px] font-semibold min-w-4 text-center">{l.cantidad}</span>
                                                    <button type="button" onClick={() => updateLine(i, { cantidad: l.cantidad + 1 })} className="w-[26px] h-[26px] flex items-center justify-center text-ink-2 cursor-pointer" title="Uno más">
                                                        <Plus className="w-[13px] h-[13px]" />
                                                    </button>
                                                </div>
                                                <span className="flex-1 min-w-0 text-[13px] font-medium truncate">{l.nombre}</span>
                                                <span className="flex items-center gap-0.5 font-mono text-[13px] text-ink-3">
                                                    $
                                                    <input
                                                        type="number"
                                                        value={l.monto}
                                                        onChange={e => updateLine(i, { monto: e.target.value })}
                                                        className="w-[62px] bg-transparent font-mono text-[13px] font-medium text-ink text-right focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setLines(prev => prev.filter((_, j) => j !== i))}
                                                    className="w-6 h-6 rounded-md flex items-center justify-center text-ink-4 hover:bg-danger-bg hover:text-danger cursor-pointer"
                                                    title="Quitar"
                                                >
                                                    <X className="w-[13px] h-[13px]" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2.5">
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-semibold text-ink-2">Pago</span>
                                    <PaymentToggle value={metodoPago} onChange={setMetodoPago} />
                                </div>
                                <label className="flex flex-col gap-2">
                                    <span className="text-xs font-semibold text-ink-2">Entrega</span>
                                    <input type="time" value={horarioEntrega} onChange={e => setHorarioEntrega(e.target.value)} className={`${fieldClass} font-mono`} />
                                </label>
                            </div>
                            <input
                                value={observaciones}
                                onChange={e => setObservaciones(e.target.value)}
                                placeholder="Observaciones para cocina (opcional)"
                                className={fieldClass}
                            />
                        </div>

                        <div className="px-[22px] pt-4 pb-5 border-t border-line-soft bg-soft flex flex-col gap-3.5">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[13px] text-ink-2">
                                    Total · <span className={`font-semibold ${metodoPago === 'Efectivo' ? 'text-cash' : 'text-card'}`}>{metodoPago}</span>
                                </span>
                                <span className="font-display font-bold text-[34px] tracking-[-0.03em] leading-none text-ink tabular-nums">{formatMoney(totalMonto)}</span>
                            </div>
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className="h-[52px] rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2.5 transition-colors bg-brand-red text-white hover:bg-[#C80000] cursor-pointer disabled:bg-line disabled:text-ink-4 disabled:cursor-not-allowed"
                            >
                                <Send className="w-[17px] h-[17px]" />
                                {isSending ? 'Enviando…' : 'Enviar a cocina'}
                            </button>
                        </div>
                    </>
                )}
            </form>

            {showClientesModal && (
                <ManageModal
                    title="Clientes"
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
                    title="Carta"
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
        </>
    );
}

// Efectivo / Tarjeta: el activo se pinta del color del método (verde o azul).
function PaymentToggle({ value, onChange }) {
    return (
        <div className="flex bg-paper p-[3px] rounded-[10px] h-[42px]">
            {METODOS_PAGO.map(({ id, label, icon: Icon }) => {
                const isActive = value === id;
                const activeClass = id === 'Efectivo' ? 'bg-[#0E7A4B]' : 'bg-brand-navy';
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onChange(id)}
                        className={`flex-1 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${isActive ? `${activeClass} text-white shadow-[0_1px_3px_rgba(11,27,46,0.2)]` : 'text-ink-2 hover:text-ink'}`}
                    >
                        <Icon className="w-[15px] h-[15px] hidden min-[400px]:block" />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
