import { useEffect, useState } from 'react';
import { getDeliveryDate } from '../lib/dates';

function useNow(intervalMs) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
    return now;
}

export function getUrgency(minutesLeft) {
    if (minutesLeft === null) return 'none';
    if (minutesLeft <= 0) return 'late';
    if (minutesLeft <= 10) return 'urgent';
    if (minutesLeft <= 25) return 'soon';
    return 'calm';
}

export function formatCountdown(minutesLeft) {
    if (minutesLeft === null) return null;
    if (minutesLeft <= 0) return 'ATRASADO';
    if (minutesLeft >= 60) return `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`;
    return `${minutesLeft} min`;
}

// Urgencia progresiva de un pedido según su horario de entrega: calm > soon > urgent > late.
export function useOrderUrgency(order) {
    const now = useNow(30000);
    const target = getDeliveryDate(order);
    const minutesLeft = target ? Math.round((target - now) / 60000) : null;

    return {
        urgency: getUrgency(minutesLeft),
        minutesLeft,
        countdownText: formatCountdown(minutesLeft),
    };
}
