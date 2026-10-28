import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Ventana modal del reboot: tarjeta blanca, borde fino, título a la izquierda.
export default function Modal({ title, icon: Icon, actions, onClose, children, maxWidth = 'max-w-lg' }) {
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/30" onClick={onClose}>
            <div
                className={`bg-surface border border-line rounded-[18px] shadow-[0_24px_64px_rgba(11,27,46,0.18)] w-full ${maxWidth} max-h-[85vh] flex flex-col overflow-hidden animate-card-in`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line-soft">
                    <h2 className="font-display font-bold text-xl tracking-[-0.02em] text-ink flex items-center gap-2.5 min-w-0">
                        {Icon && <Icon className="w-5 h-5 text-ink-2 shrink-0" />}
                        <span className="truncate">{title}</span>
                    </h2>
                    <div className="flex items-center gap-2 shrink-0">
                        {actions}
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-9 h-9 rounded-[9px] flex items-center justify-center text-ink-3 hover:bg-paper hover:text-ink transition-colors cursor-pointer"
                            title="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="overflow-y-auto">{children}</div>
            </div>
        </div>,
        document.body
    );
}
