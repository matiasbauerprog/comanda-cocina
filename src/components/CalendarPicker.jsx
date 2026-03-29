import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function CalendarPicker({ selectedDate, onSelect, onClose }) {
    // Parse selectedDate carefully to avoid UTC shift
    const initialDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
    const [currentMonth, setCurrentMonth] = useState(initialDate);

    const daysOfWeek = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];

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

    const isSelected = (date) => {
        if (!selectedDate) return false;
        const s = new Date(selectedDate + 'T00:00:00');
        return date.getFullYear() === s.getFullYear() &&
            date.getMonth() === s.getMonth() &&
            date.getDate() === s.getDate();
    };

    const isToday = (date) => {
        return date.toDateString() === new Date().toDateString();
    };

    return (
        <div className="bg-[#E9EDE0] rounded-3xl p-6 w-[320px] shadow-xl animate-card-in select-none border border-[#dee2d5]">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-[17px] font-medium text-slate-800 lowercase tracking-tight">
                    {monthName}
                </h2>
                <div className="flex gap-4">
                    <button onClick={() => changeMonth(-1)} className="text-slate-500 hover:text-slate-800 transition-colors">
                        <ChevronUp className="w-5 h-5" />
                    </button>
                    <button onClick={() => changeMonth(1)} className="text-slate-500 hover:text-slate-800 transition-colors">
                        <ChevronDown className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 mb-4">
                {daysOfWeek.map(day => (
                    <span key={day} className="text-[11px] font-bold text-slate-900 text-center">{day}</span>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-2">
                {days.map((item, idx) => {
                    const selected = isSelected(item.date);
                    return (
                        <div key={idx} className="flex justify-center items-center h-10">
                            <button
                                onClick={() => {
                                    const dateStr = item.date.toISOString().split('T')[0];
                                    onSelect(dateStr);
                                    if (onClose) onClose();
                                }}
                                className={`
                                    w-10 h-10 rounded-full text-sm transition-all duration-300
                                    ${item.current ? 'text-slate-800 font-medium' : 'text-slate-400'}
                                    ${selected ? 'bg-[#0061C2] !text-white font-bold scale-110 shadow-lg' : 'hover:bg-slate-200/50'}
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
