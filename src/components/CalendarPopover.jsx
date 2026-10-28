import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CalendarPicker from './CalendarPicker';

const POPOVER_WIDTH = 320;

// Calcula la posición del popover a partir del botón que lo abre.
// Se llama desde el handler de click, nunca durante el render.
function anchorPosition(el) {
    const rect = el.getBoundingClientRect();
    return {
        top: rect.bottom + 8,
        left: Math.max(10, Math.min(window.innerWidth - POPOVER_WIDTH - 10, rect.left + rect.width / 2 - POPOVER_WIDTH / 2)),
    };
}

// Botón + calendario flotante. `renderTrigger` recibe { ref, onClick, isOpen } y dibuja
// el botón; `ref` tiene que ir en el elemento del botón para ubicar el popover.
export default function CalendarPopover({ selectedDate, onSelect, renderTrigger }) {
    const [position, setPosition] = useState(null);
    const triggerRef = useRef(null);
    const popoverRef = useRef(null);
    const isOpen = position !== null;

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (popoverRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
            setPosition(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggle = () => setPosition(isOpen ? null : anchorPosition(triggerRef.current));

    return (
        <>
            {renderTrigger({ ref: triggerRef, onClick: toggle, isOpen })}
            {isOpen && createPortal(
                <div ref={popoverRef} className="fixed z-[120]" style={position}>
                    <CalendarPicker
                        selectedDate={selectedDate}
                        onSelect={(date) => { onSelect(date); setPosition(null); }}
                    />
                </div>,
                document.body
            )}
        </>
    );
}
