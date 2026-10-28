import { useState } from 'react';
import { Lock, Loader2, Download, ChefHat, LayoutDashboard } from 'lucide-react';
import { signIn } from '../lib/auth';
import Segmented from '../components/ui/Segmented';

const ROLE_OPTIONS = [
    { id: 'owner', label: 'Gaspi', icon: LayoutDashboard },
    { id: 'kitchen', label: 'Comanda', icon: ChefHat },
];

export default function LoginView() {
    const [role, setRole] = useState('owner');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // PWA Install — uses global prompt captured in main.jsx
    const handleInstall = async () => {
        const prompt = window.deferredInstallPrompt;
        if (prompt) {
            prompt.prompt();
            const { outcome } = await prompt.userChoice;
            if (outcome === 'accepted') {
                window.deferredInstallPrompt = null;
            }
        } else if (window.matchMedia('(display-mode: standalone)').matches) {
            alert('¡La app ya está instalada!');
        } else {
            alert('Tu navegador aún no habilitó la instalación. Intentá recargar con Ctrl+F5 y esperá unos segundos antes de tocar "Instalar App".');
        }
    };

    // Al ingresar, App detecta la sesión nueva (onAuthStateChange) y cambia de vista.
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const err = await signIn(role, password);
        setLoading(false);
        if (err) {
            console.error('Error de login:', err);
            setError(err.status === 400 ? 'Contraseña incorrecta' : 'No se pudo conectar. Revisá la conexión.');
            setPassword('');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-paper px-4">
            <div className="w-full max-w-sm bg-surface border border-line rounded-[18px] p-7 sm:p-8 flex flex-col animate-card-in">
                <div className="flex items-center gap-3 mb-7">
                    <img src="/chef-logo.jpg" alt="Gaspacho" className="w-12 h-12 rounded-xl object-cover object-[center_30%]" />
                    <div className="flex flex-col leading-none">
                        <span className="font-display font-extrabold text-[26px] tracking-[-0.03em] text-brand-navy">
                            Gaspacho<span className="text-brand-red">.</span>
                        </span>
                        <span className="text-xs text-ink-3 mt-1">Pedidos · cocina · ventas</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Segmented
                        options={ROLE_OPTIONS}
                        value={role}
                        onChange={(id) => { setRole(id); setError(''); }}
                    />

                    <label className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-ink-2">Contraseña</span>
                        <div className={`flex items-center gap-2.5 h-12 px-3.5 rounded-xl border bg-surface ${error ? 'border-brand-red animate-[shake_0.4s_ease-in-out]' : 'border-line-strong focus-within:border-ink-3'}`}>
                            <Lock className="w-4 h-4 text-ink-4 shrink-0" />
                            <input
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (error) setError('');
                                }}
                                className="flex-1 min-w-0 h-full bg-transparent text-base text-ink focus:outline-none"
                                autoFocus
                                disabled={loading}
                            />
                        </div>
                    </label>

                    <button
                        type="submit"
                        disabled={!password || loading}
                        className="h-[52px] rounded-xl bg-brand-navy hover:bg-[#001A3A] text-white text-[15px] font-semibold flex items-center justify-center cursor-pointer disabled:bg-line disabled:text-ink-4 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ingresar'}
                    </button>
                </form>

                {error && (
                    <p className="mt-4 text-danger text-sm font-medium text-center">{error}</p>
                )}

                <button
                    onClick={handleInstall}
                    className="mt-6 self-center text-[13px] text-ink-3 hover:text-brand-navy transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                >
                    <Download className="w-4 h-4" />
                    Instalar app
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
        }
      `}} />
        </div>
    );
}
