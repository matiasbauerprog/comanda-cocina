import { useState } from 'react';
import { X, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { changePassword, MIN_PASSWORD_LENGTH } from '../lib/auth';

// Cambia la contraseña del usuario con el que se ingresó (dueño o cocina).
export default function ChangePasswordModal({ onClose }) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
            return;
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden');
            return;
        }
        setLoading(true);
        const err = await changePassword(password);
        setLoading(false);
        if (err) {
            console.error('Error cambiando contraseña:', err);
            setError(err.message);
            return;
        }
        setDone(true);
        setTimeout(onClose, 1800);
    };

    const inputClass = "w-full h-12 px-4 rounded-2xl bg-white border-2 border-slate-100 text-brand-navy font-bold placeholder:text-slate-300 placeholder:font-normal focus:outline-none focus:border-brand-navy/20 transition-all";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-card-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-display font-bold uppercase tracking-wide text-gray-800 flex items-center gap-2">
                        <KeyRound className="w-5 h-5" /> Cambiar contraseña
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {done ? (
                    <div className="flex flex-col items-center gap-3 py-10">
                        <CheckCircle2 className="w-14 h-14 text-green-500" />
                        <span className="text-brand-navy font-bold">¡Contraseña actualizada!</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-3">
                        <input
                            type="password"
                            autoComplete="new-password"
                            placeholder="Nueva contraseña"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(''); }}
                            className={inputClass}
                            autoFocus
                            disabled={loading}
                        />
                        <input
                            type="password"
                            autoComplete="new-password"
                            placeholder="Repetir contraseña"
                            value={confirm}
                            onChange={e => { setConfirm(e.target.value); setError(''); }}
                            className={inputClass}
                            disabled={loading}
                        />
                        {error && <p className="text-brand-red text-sm font-medium">{error}</p>}
                        <button
                            type="submit"
                            disabled={!password || !confirm || loading}
                            className="h-12 mt-2 bg-brand-navy text-white rounded-2xl font-display font-bold tracking-widest uppercase disabled:opacity-50 flex items-center justify-center cursor-pointer"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
