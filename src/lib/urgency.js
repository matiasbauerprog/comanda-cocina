// Colores de cada nivel de urgencia (ver getUrgency en hooks/useOrderUrgency).
// strip*/border: tarjeta del Gestor. k*: tarjeta de la Comanda (modo oscuro).
export const URGENCY_THEME = {
    none: { stripBg: '#F4F2EC', stripFg: '#5C6470', border: '#E6E2D8', kBg: '#1B2A40', kFg: '#B9C6D8', kBorder: '#22324A' },
    calm: { stripBg: '#E8EEF6', stripFg: '#002855', border: '#E6E2D8', kBg: '#1E3556', kFg: '#C9D8EE', kBorder: '#22324A' },
    soon: { stripBg: '#FFF2B3', stripFg: '#5E4500', border: '#F1DC80', kBg: '#FFD700', kFg: '#1F1700', kBorder: '#FFD700' },
    urgent: { stripBg: '#FDE3E3', stripFg: '#A30000', border: '#F5B5B5', kBg: '#FF6B6B', kFg: '#2A0000', kBorder: '#FF6B6B' },
    late: { stripBg: '#E60000', stripFg: '#FFFFFF', border: '#E60000', kBg: '#E60000', kFg: '#FFFFFF', kBorder: '#E60000' },
};
