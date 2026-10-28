import { useSyncExternalStore } from 'react';

// Coincide con el breakpoint `lg` de Tailwind (1024px).
const QUERY = '(max-width: 1023px)';

function subscribe(callback) {
    const mql = window.matchMedia(QUERY);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
}

export function isMobileViewport() {
    return window.matchMedia(QUERY).matches;
}

export function useIsMobile() {
    return useSyncExternalStore(subscribe, isMobileViewport);
}
