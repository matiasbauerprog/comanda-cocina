import { useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';

function RetryButton({ onClick }) {
    return (
        <button onClick={onClick} className="h-8 px-3.5 bg-brand-navy text-white rounded-lg font-semibold text-xs cursor-pointer">
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
                    <span className="text-ink font-semibold text-sm">No se pudo cargar el historial.</span>
                    <RetryButton onClick={ensureHistory} />
                </>
            ) : (
                <>
                    <Loader2 className="w-10 h-10 text-brand-red animate-spin" />
                    <span className="text-ink-2 text-sm font-medium">
                        Cargando historial…
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-ink text-night-ink rounded-xl shadow-[0_12px_32px_rgba(11,27,46,0.25)] px-4 py-2.5 text-[13px] font-medium">
            {historyStatus === 'loading' ? (
                <>
                    <Loader2 className="w-4 h-4 text-[#FF8A8A] animate-spin" />
                    Cargando historial…
                </>
            ) : (
                <>
                    <AlertTriangle className="w-4 h-4 text-[#FF8A8A]" />
                    No se pudo cargar el historial
                    <RetryButton onClick={ensureHistory} />
                </>
            )}
        </div>
    );
}
