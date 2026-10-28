import { useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';

function RetryButton({ onClick }) {
    return (
        <button onClick={onClick} className="px-4 py-1.5 bg-brand-navy text-white rounded-xl font-bold text-xs cursor-pointer">
            Reintentar
        </button>
    );
}

// Muestra `children` recién cuando está cargado el historial completo de pedidos
// (la app arranca solo con los de hoy y los pendientes).
export default function HistoryGate({ children }) {
    const { historyStatus, ensureHistory } = useStore();

    useEffect(() => {
        ensureHistory();
    }, [ensureHistory]);

    if (historyStatus === 'loaded') return children;

    return (
        <div className="h-full min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center px-6">
            {historyStatus === 'error' ? (
                <>
                    <AlertTriangle className="w-10 h-10 text-brand-red" />
                    <span className="text-brand-navy font-bold text-sm">No se pudo cargar el historial.</span>
                    <RetryButton onClick={ensureHistory} />
                </>
            ) : (
                <>
                    <Loader2 className="w-10 h-10 text-brand-red animate-spin" />
                    <span className="text-brand-navy font-display font-black tracking-widest uppercase text-sm animate-pulse">
                        Cargando historial...
                    </span>
                </>
            )}
        </div>
    );
}

// Aviso flotante para el Gestor, cuando un filtro (semana, mes, otro día) pidió el historial.
export function HistoryStatusPill() {
    const { historyStatus, ensureHistory } = useStore();
    if (historyStatus !== 'loading' && historyStatus !== 'error') return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-white rounded-full shadow-xl shadow-slate-300/40 border border-slate-100 px-4 py-2 text-xs font-bold text-brand-navy">
            {historyStatus === 'loading' ? (
                <>
                    <Loader2 className="w-4 h-4 text-brand-red animate-spin" />
                    Cargando historial...
                </>
            ) : (
                <>
                    <AlertTriangle className="w-4 h-4 text-brand-red" />
                    No se pudo cargar el historial
                    <RetryButton onClick={ensureHistory} />
                </>
            )}
        </div>
    );
}
