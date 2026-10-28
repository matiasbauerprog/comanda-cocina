import { useState } from 'react';
import { Lock, Loader2, Download, ChefHat, LayoutDashboard } from 'lucide-react';
import { signIn } from '../lib/auth';

const ROLE_OPTIONS = [
    { id: 'owner', label: 'Dueño', icon: LayoutDashboard },
    { id: 'kitchen', label: 'Cocina', icon: ChefHat },
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] px-4 font-sans relative overflow-hidden">
            {/* Decorative background blurs to keep Gaspacho's modern aesthetic */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-brand-navy/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-sm glass rounded-[2rem] p-8 sm:p-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10 shadow-2xl shadow-brand-navy/5 border border-white/40">

                {/* Logo */}
                <div className="flex flex-col items-center gap-4 mb-8">
                    <img
                        src="/chef-logo.jpg"
                        alt="Gaspacho"
                        className="w-20 h-20 rounded-3xl shadow-xl shadow-slate-200/60 object-cover transition-all"
                    />
                    <span className="text-brand-navy text-3xl font-display font-black tracking-tighter leading-none">
                        GASPACHO<span className="text-brand-red">.</span>
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                    {/* Rol */}
                    <div className="flex bg-slate-100/70 p-1 rounded-2xl ring-1 ring-slate-200/60">
                        {ROLE_OPTIONS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => { setRole(id); setError(''); }}
                                className={`flex-1 h-10 rounded-xl text-xs font-display font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${role === id
                                    ? 'bg-brand-navy text-white shadow-lg shadow-brand-navy/20'
                                    : 'text-slate-500 hover:text-brand-navy hover:bg-white/80'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError('');
                            }}
                            className={`w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-2 text-center text-xl tracking-widest font-bold placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal placeholder:text-base focus:outline-none transition-all duration-300
                                ${error
                                    ? 'border-brand-red/50 text-brand-red animate-[shake_0.4s_ease-in-out]'
                                    : 'border-slate-100 text-brand-navy focus:border-brand-navy/20 focus:shadow-lg focus:shadow-brand-navy/5'
                                }
                                `}
                            autoFocus
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!password || loading}
                        className="w-full h-14 bg-brand-navy text-white rounded-2xl font-display font-bold tracking-widest uppercase hover:bg-opacity-90 active:scale-95 transition-all duration-300 shadow-xl shadow-brand-navy/20 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center mt-2"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Ingresar'}
                    </button>
                </form>

                {error && (
                    <p className="mt-4 text-brand-red text-sm font-medium animate-in fade-in zoom-in duration-300">
                        {error}
                    </p>
                )}

                <button
                    onClick={handleInstall}
                    className="mt-6 text-sm text-slate-400 hover:text-brand-navy transition-colors font-medium flex items-center gap-1.5"
                >
                    <Download className="w-4 h-4" />
                    Instalar App
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
