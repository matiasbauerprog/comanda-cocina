// Selector tipo "pastilla": navegación, método de pago y filtros.
// options: [{ id, label, icon?, badge? }]
export default function Segmented({ options, value, onChange, size = 'md', className = '' }) {
    const height = size === 'sm' ? 'h-8 text-[13px]' : 'h-[34px] text-[13px]';

    return (
        <div className={`flex gap-0.5 bg-track p-[3px] rounded-[11px] ${className}`}>
            {options.map(({ id, label, icon: Icon, badge }) => {
                const isActive = value === id;
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onChange(id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${height} ${isActive
                            ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(11,27,46,0.08),0_0_0_1px_rgba(11,27,46,0.04)]'
                            : 'text-ink-2 hover:text-ink'
                            }`}
                    >
                        {Icon && <Icon className="w-[15px] h-[15px] shrink-0" />}
                        {label}
                        {badge ? (
                            <span className="font-mono text-[11px] font-semibold min-w-5 h-[18px] px-1.5 rounded-full flex items-center justify-center bg-brand-red text-white">
                                {badge}
                            </span>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
}
