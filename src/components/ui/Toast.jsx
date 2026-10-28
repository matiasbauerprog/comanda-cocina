import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CircleCheck } from 'lucide-react';

const ToastContext = createContext(() => {});

// Aviso breve abajo al centro ("Pedido de Ana enviado a cocina").
export function ToastProvider({ children }) {
    const [message, setMessage] = useState('');
    const timer = useRef(null);

    const show = useCallback((msg) => {
        setMessage(msg);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setMessage(''), 2600);
    }, []);

    useEffect(() => () => clearTimeout(timer.current), []);

    return (
        <ToastContext.Provider value={show}>
            {children}
            {message && (
                <div
                    role="status"
                    className="fixed left-1/2 bottom-6 -translate-x-1/2 z-[70] max-w-[calc(100vw-32px)] bg-ink text-night-ink rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm shadow-[0_12px_32px_rgba(11,27,46,0.25)] animate-card-in"
                >
                    <CircleCheck className="w-4 h-4 text-[#5BD39A] shrink-0" />
                    {message}
                </div>
            )}
        </ToastContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    return useContext(ToastContext);
}
