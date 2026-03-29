import { Users, UserPlus, Star, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function CustomerLoyalty({ kpis }) {
    if (!kpis) return null;

    const { nuevos, fieles, total } = kpis.segmentacion;
    const totalSegmented = (nuevos.length + fieles.length) || 1;
    const [selectedSegment, setSelectedSegment] = useState(null); // { title: string, data: array }

    return (
        <div className="flex flex-col gap-8">
            {/* 1. Segmentación de Clientes */}
            <div>
                <h3 className="text-sm font-display font-black text-brand-navy tracking-wide mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Base de Clientes ({total} Históricos)
                </h3>

                <div className="grid grid-cols-2 gap-2 lg:gap-3 mb-4">
                    <div
                        onClick={() => nuevos.length > 0 && setSelectedSegment({ title: 'Nuevos Clientes (Último mes)', data: nuevos, color: 'text-primary-blue', bg: 'bg-blue-50/50' })}
                        className={`p-3 lg:p-4 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center shadow-sm transition-all duration-300 ${nuevos.length > 0 ? 'bg-blue-50/50 hover:bg-blue-100/50 cursor-pointer active:scale-95' : 'bg-slate-50 opacity-50'}`}
                    >
                        <UserPlus className={`w-4 h-4 lg:w-5 lg:h-5 mb-1 lg:mb-2 ${nuevos.length > 0 ? 'text-primary-blue' : 'text-slate-400'}`} />
                        <span className={`text-xl lg:text-2xl font-display font-black ${nuevos.length > 0 ? 'text-primary-blue' : 'text-slate-400'}`}>{nuevos.length}</span>
                        <span className="text-[8px] lg:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Nuevos</span>
                    </div>
                    <div
                        onClick={() => fieles.length > 0 && setSelectedSegment({ title: 'Clientes Fieles', data: fieles, color: 'text-emerald-600', bg: 'bg-emerald-50/50' })}
                        className={`p-3 lg:p-4 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center shadow-sm transition-all duration-300 ${fieles.length > 0 ? 'bg-emerald-50/50 hover:bg-emerald-100/50 cursor-pointer active:scale-95' : 'bg-slate-50 opacity-50'}`}
                    >
                        <Star className={`w-4 h-4 lg:w-5 lg:h-5 mb-1 lg:mb-2 ${fieles.length > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className={`text-xl lg:text-2xl font-display font-black ${fieles.length > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{fieles.length}</span>
                        <span className="text-[8px] lg:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Fieles</span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 flex overflow-hidden shadow-inner">
                    <div className="bg-primary-blue h-full transition-all duration-1000" style={{ width: `${(nuevos.length / totalSegmented) * 100}%` }} title="Nuevos" />
                    <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(fieles.length / totalSegmented) * 100}%` }} title="Fieles" />
                </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl mt-auto">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Criterios de Segmentación</h4>
                <ul className="text-[10px] space-y-2 text-slate-500">
                    <li className="flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
                        <span><strong className="font-bold text-slate-700">Fieles:</strong> 3 o más pedidos en el historial (independiente del mes).</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-blue shrink-0 mt-1"></span>
                        <span><strong className="font-bold text-slate-700">Importante:</strong> Haz clic en los recuadros de arriba para ver la lista de clientes.</span>
                    </li>
                </ul>
            </div>

            {/* Modal de Detalle de Segmento */}
            {selectedSegment && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedSegment(null)}
                    />
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
                        {/* Header Modal */}
                        <div className={`p-6 pb-4 border-b border-brand-navy/10 flex items-start justify-between gap-4 ${selectedSegment.bg}`}>
                            <div className="flex items-center gap-3">
                                {selectedSegment.title.includes('Nuevos') ?
                                    <UserPlus className={`w-6 h-6 ${selectedSegment.color}`} /> :
                                    <Star className={`w-6 h-6 ${selectedSegment.color}`} />}
                                <div>
                                    <h3 className={`font-display font-black text-lg leading-tight ${selectedSegment.color}`}>
                                        {selectedSegment.title}
                                    </h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        {selectedSegment.data.length} personas
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedSegment(null)}
                                className="w-8 h-8 rounded-full bg-white/50 hover:bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Lista de Clientes */}
                        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
                            {selectedSegment.data.map((cliente, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${selectedSegment.bg} ${selectedSegment.color}`}>
                                            {cliente.nombre.trim().charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-slate-700 capitalize truncate" title={cliente.nombre.trim()}>
                                            {cliente.nombre.trim()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0 pl-4">
                                        <span className={`text-base font-black ${selectedSegment.color}`}>
                                            {cliente.conteo}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                                            {cliente.conteo === 1 ? 'pedido' : 'pedidos'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
