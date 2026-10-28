import { useState } from 'react';
import { KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import Modal from './ui/Modal';
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

    const inputClass = "w-full h-12 px-3.5 rounded-xl bg-surface border border-line-strong text-base text-ink focus:outline-none focus:border-ink-3";

    return (
        <Modal title="Cambiar contraseña" icon={KeyRound} onClose={onClose} maxWidth="max-w-sm">
            {done ? (
                <div className="flex flex-col items-center gap-3 py-10">
                    <CheckCircle2 className="w-12 h-12 text-live" />
                    <span className="text-ink font-semibold">¡Contraseña actualizada!</span>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
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
                    {error && <p className="text-danger text-sm font-medium">{error}</p>}
                    <button
                        type="submit"
                        disabled={!password || !confirm || loading}
                        className="h-12 mt-1 bg-brand-navy hover:bg-[#001A3A] text-white rounded-xl text-[15px] font-semibold flex items-center justify-center cursor-pointer disabled:bg-line disabled:text-ink-4 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar'}
                    </button>
                </form>
            )}
        </Modal>
    );
}
