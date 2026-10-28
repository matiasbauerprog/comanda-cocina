import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { parseLocalISODate, toLocalISODate } from '../lib/dates';

export default function CalendarPicker({ selectedDate, onSelect }) {
    const initialDate = selectedDate ? parseLocalISODate(selectedDate) : new Date();
    const [currentMonth, setCurrentMonth] = useState(initialDate);

    const daysOfWeek = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

    // Helper to get days in month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        let startOffset = firstDay.getDay() - 1; // 0 for LU
        if (startOffset === -1) startOffset = 6; // DO

        const days = [];

        // Prev month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startOffset - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, current: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
        }

        // Current month days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ day: i, current: true, date: new Date(year, month, i) });
        }

        // Next month days
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, current: false, date: new Date(year, month + 1, i) });
        }

        return days;
    };

    const monthName = currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const days = getDaysInMonth(currentMonth);

    const changeMonth = (offset) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    };

    const isSelected = (date) => selectedDate === toLocalISODate(date);

    const today = toLocalISODate(new Date());

    return (
        <div className="bg-surface border border-line rounded-2xl p-4 w-[320px] shadow-[0_16px_40px_rgba(11,27,46,0.16)] animate-card-in select-none">
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="font-display text-[17px] font-bold tracking-[-0.02em] text-ink first-letter:uppercase">
                    {monthName}
                </h2>
                <div className="flex gap-1">
                    <button type="button" onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-2 hover:bg-paper cursor-pointer" title="Mes anterior">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => changeMonth(1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-2 hover:bg-paper cursor-pointer" title="Mes siguiente">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 mb-1">
                {daysOfWeek.map(day => (
                    <span key={day} className="text-[11px] font-semibold text-ink-3 text-center py-1">{day}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
                {days.map((item, idx) => {
                    const iso = toLocalISODate(item.date);
                    const selected = isSelected(item.date);
                    return (
                        <div key={idx} className="flex justify-center items-center">
                            <button
                                type="button"
                                onClick={() => onSelect(iso)}
                                className={`w-9 h-9 rounded-full font-mono text-[13px] transition-colors cursor-pointer
                                    ${item.current ? 'text-ink' : 'text-ink-4'}
                                    ${selected ? 'bg-brand-navy !text-white font-semibold' : iso === today ? 'ring-1 ring-brand-navy/40 hover:bg-paper' : 'hover:bg-paper'}
                                `}
                            >
                                {item.day}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
