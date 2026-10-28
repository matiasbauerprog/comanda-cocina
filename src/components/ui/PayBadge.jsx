// Etiqueta del método de pago (verde efectivo, azul tarjeta).
export default function PayBadge({ metodo, className = '' }) {
    const isCash = metodo === 'Efectivo';
    return (
        <span className={`text-[11px] font-semibold px-[7px] py-[3px] rounded-md whitespace-nowrap ${isCash ? 'bg-cash-bg text-cash' : 'bg-card-bg text-card'} ${className}`}>
            {metodo}
        </span>
    );
}
