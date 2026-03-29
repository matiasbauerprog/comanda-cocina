import { useState } from 'react';
import { Lock, Loader2, KeyRound, ArrowLeft, CheckCircle2, Download } from 'lucide-react';

const DEFAULT_OWNER_HASH = 'cbfad02f9ed2a8d1e08d8f74f5303e9eb93637d47f82ab6f1c15871cf8dd0481'; // "1212"
const DEFAULT_KITCHEN_HASH = 'c1f330d0aff31c1c87403f1e4347bcc21aff7c179908723535f2b31723702525'; // "5555"

// Polyfill function specifically for SHA-256 in browser
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export default function LoginView({ onLogin }) {
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isChanging, setIsChanging] = useState(false);

    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    // PWA Install — uses global prompt captured in main.jsx
    const handleInstall = async () => {
        const prompt = window.deferredInstallPrompt;
        if (prompt) {
            console.log('[PWA] Triggering install prompt...');
            prompt.prompt();
            const { outcome } = await prompt.userChoice;
            console.log('[PWA] User choice:', outcome);
            if (outcome === 'accepted') {
                window.deferredInstallPrompt = null;
            }
        } else {
            console.warn('[PWA] No install prompt available. Check DevTools > Application > Manifest for errors.');
            // Check if already installed (display-mode: standalone)
            if (window.matchMedia('(display-mode: standalone)').matches) {
                alert('¡La app ya está instalada!');
            } else {
                alert('Tu navegador aún no habilitó la instalación. Intentá recargar con Ctrl+F5 y esperá unos segundos antes de tocar "Instalar App".');
            }
        }
    };

    const getOwnerHash = () => localStorage.getItem('gaspacho_owner_hash') || DEFAULT_OWNER_HASH;
    const getKitchenHash = () => localStorage.getItem('gaspacho_kitchen_hash') || DEFAULT_KITCHEN_HASH;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(false);
        setSuccess('');
        setLoading(true);

        // Add small artificial delay to prevent brute-forcing easily via UI 
        await new Promise(r => setTimeout(r, 400));

        try {
            const hash = await sha256(password);
            const ownerHash = getOwnerHash();
            const kitchenHash = getKitchenHash();

            if (isChanging) {
                if (hash === ownerHash) {
                    const newHash = await sha256(newPassword);
                    localStorage.setItem('gaspacho_owner_hash', newHash);
                    handleSuccess('¡Clave de Dueño actualizada!');
                } else if (hash === kitchenHash) {
                    const newHash = await sha256(newPassword);
                    localStorage.setItem('gaspacho_kitchen_hash', newHash);
                    handleSuccess('¡Clave de Cocina actualizada!');
                } else {
                    setError(true);
                }
            } else {
                if (hash === ownerHash) {
                    onLogin('owner');
                } else if (hash === kitchenHash) {
                    onLogin('kitchen');
                } else {
                    setError(true);
                    setPassword('');
                }
            }
        } catch (err) {
            console.error("Error hashing password", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = (msg) => {
        setSuccess(msg);
        setPassword('');
        setNewPassword('');
        setTimeout(() => {
            setIsChanging(false);
            setSuccess('');
        }, 2500);
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

                {success ? (
                    <div className="flex flex-col items-center gap-3 animate-in zoom-in duration-500 py-4">
                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                        <span className="text-brand-navy font-bold text-center">{success}</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                placeholder={isChanging ? "Contraseña actual" : "Contraseña"}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (error) setError(false);
                                }}
                                className={`w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-2 text-center text-xl tracking-widest font-bold placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal placeholder:text-base focus:outline-none transition-all duration-300
                                ${error
                                        ? 'border-brand-red/50 text-brand-red animate-[shake_0.4s_ease-in-out]'
                                        : 'border-slate-100 text-brand-navy focus:border-brand-navy/20 focus:shadow-lg focus:shadow-brand-navy/5'
                                    }
                                `}
                                autoFocus
                                disabled={loading}
                                inputMode="numeric"
                            />
                        </div>

                        {isChanging && (
                            <div className="relative animate-in slide-in-from-top-4 fade-in duration-300">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    placeholder="Nueva contraseña"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-2 border-slate-100 text-brand-navy text-center text-xl tracking-widest font-bold placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal placeholder:text-base focus:outline-none transition-all duration-300 focus:border-brand-navy/20 focus:shadow-lg focus:shadow-brand-navy/5"
                                    disabled={loading}
                                    inputMode="numeric"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!password || (isChanging && !newPassword) || loading}
                            className="w-full h-14 bg-brand-navy text-white rounded-2xl font-display font-bold tracking-widest uppercase hover:bg-opacity-90 active:scale-95 transition-all duration-300 shadow-xl shadow-brand-navy/20 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center mt-2"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isChanging ? 'Actualizar' : 'Ingresar')}
                        </button>
                    </form>
                )}

                {error && !success && (
                    <p className="mt-4 text-brand-red text-sm font-medium animate-in fade-in zoom-in duration-300">
                        {isChanging ? 'La contraseña actual es incorrecta' : 'Contraseña incorrecta'}
                    </p>
                )}

                {!success && (
                    <div className="flex items-center gap-4 mt-6">
                        <button
                            onClick={() => {
                                setIsChanging(!isChanging);
                                setError(false);
                                setPassword('');
                                setNewPassword('');
                            }}
                            className="text-sm text-slate-400 hover:text-brand-navy transition-colors font-medium flex items-center gap-1"
                        >
                            {isChanging ? (
                                <><ArrowLeft className="w-4 h-4" /> Volver al ingreso</>
                            ) : (
                                '¿Cambiar contraseña?'
                            )}
                        </button>

                        {!isChanging && (
                            <>
                                <span className="text-slate-200">|</span>
                                <button
                                    onClick={handleInstall}
                                    className="text-sm text-slate-400 hover:text-brand-navy transition-colors font-medium flex items-center gap-1.5"
                                >
                                    <Download className="w-4 h-4" />
                                    Instalar App
                                </button>
                            </>
                        )}
                    </div>
                )}
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
