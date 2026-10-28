import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { matchesSearch } from '../lib/clientes';

// Selector con buscador. Si recibe iconMinus/iconPlus, cada opción tiene un control
// de cantidad y onChange recibe (id, cantidad). `ref` apunta al botón (para darle foco).
export default function CustomDropdown({ ref, placeholder, options, value, onChange, icon: Icon, iconMinus: IconMinus, iconPlus: IconPlus }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const [pendingQtys, setPendingQtys] = useState({});

    const hasQuantityControls = !!(IconMinus && IconPlus);
    const selectedOption = options.find(opt => opt.id === value);

    const filteredOptions = options.filter(opt => matchesSearch(search, opt.label, opt.detail));

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
                    ref={ref}
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
