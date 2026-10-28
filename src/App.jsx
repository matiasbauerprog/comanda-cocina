import { useState, useEffect } from 'react';
import { StoreProvider } from './store/StoreProvider';
import { useStore } from './store/useStore';
import { supabase } from './lib/supabase';
import { getRole, signOut } from './lib/auth';
import ChangePasswordModal from './components/ChangePasswordModal';
import OwnerView from './views/OwnerView';
import KitchenView from './views/KitchenView';
import AnalyticsView from './views/AnalyticsView';
import LoginView from './views/LoginView';

import { ChefHat, LayoutDashboard, Menu, X, TrendingUp, Loader2, LogOut, KeyRound, AlertTriangle } from 'lucide-react';

function NavButton({ currentView, targetView, icon: Icon, label, onClick, isMobile = false }) {
  const isActive = currentView === targetView;
  const baseClasses = `flex items-center justify-center gap-2 rounded-[14px] text-xs font-display font-bold tracking-wider transition-all duration-500 cursor-pointer ${isActive ? 'bg-brand-navy text-white shadow-lg shadow-brand-navy/20' : 'text-slate-500 hover:text-brand-navy hover:bg-white/80'
    }`;

  const additionalClasses = isMobile ? 'flex-1 px-4 py-2.5 min-w-[100px] sm:min-w-[auto]' : 'px-6 py-2 h-full';

  return (
    <button onClick={onClick} className={`${baseClasses} ${additionalClasses}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="uppercase">{label}</span>
    </button>
  );
}

function FullScreenMessage({ children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] gap-4 px-6 text-center">
      {children}
    </div>
  );
}

function HeaderActions({ onLogout, onChangePassword }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        onClick={onChangePassword}
        className="p-2 rounded-xl text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-colors cursor-pointer"
        title="Cambiar contraseña"
      >
        <KeyRound className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <button
        onClick={onLogout}
        className="p-2 sm:px-4 sm:py-2 rounded-xl text-brand-red hover:bg-brand-red/10 transition-colors flex items-center gap-2 text-sm font-bold tracking-wider uppercase cursor-pointer"
        title="Cerrar Sesión"
      >
        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">Salir</span>
      </button>
    </div>
  );
}

function AppContent({ userRole, onLogout }) {
  const { isInitialized, loadError, reload } = useStore();
  const [view, setView] = useState(userRole === 'kitchen' ? 'kitchen' : 'owner');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  if (loadError) {
    return (
      <FullScreenMessage>
        <AlertTriangle className="w-12 h-12 text-brand-red" />
        <span className="text-brand-navy font-display font-black tracking-widest uppercase text-sm">
          No se pudieron cargar los datos
        </span>
        <span className="text-slate-400 text-xs">{loadError}</span>
        <div className="flex gap-3">
          <button onClick={reload} className="px-6 py-2 bg-brand-navy text-white rounded-xl font-bold text-sm cursor-pointer">Reintentar</button>
          <button onClick={onLogout} className="px-6 py-2 text-brand-red rounded-xl font-bold text-sm cursor-pointer">Salir</button>
        </div>
      </FullScreenMessage>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] gap-4">
        <Loader2 className="w-12 h-12 text-brand-red animate-spin" />
        <span className="text-brand-navy font-display font-black tracking-widest uppercase text-sm animate-pulse">
          Cargando Base de Datos...
        </span>
      </div>
    );
  }

  const isKitchen = userRole === 'kitchen';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] font-sans selection:bg-slate-900 selection:text-white">
      {/* Header */}
      {!isKitchen ? (
        <header className="glass mx-2 sm:mx-4 lg:mx-6 mt-4 mb-2 md:mb-6 rounded-[2rem] px-6 sm:px-8 py-2.5 shrink-0 sticky top-4 z-50 transition-all duration-500 flex flex-col">
          <div className="flex items-center justify-between h-12 w-full">
            {/* 1. Left: Logo */}
            <div className="flex-1 flex justify-start">
              <div className="flex items-center gap-4 group cursor-pointer shrink-0" onClick={() => setView('owner')}>
                <img src="/chef-logo.jpg" alt="Gaspacho" className="w-10 h-10 rounded-2xl shadow-lg shadow-slate-200/50 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 object-cover shrink-0" />
                <span className="text-brand-navy text-xl sm:text-2xl font-display font-black tracking-tighter leading-none hidden sm:inline">
                  GASPACHO<span className="text-brand-red">.</span>
                </span>
              </div>
            </div>

            {/* 2. Center: Navigation (Desktop) */}
            <div className="hidden md:flex justify-center flex-shrink-0 mx-4">
              <div className="flex bg-slate-100/50 rounded-2xl p-1 gap-1 ring-1 ring-slate-200/60 h-10 items-center">
                <NavButton currentView={view} targetView="owner" icon={LayoutDashboard} label="Gestor" onClick={() => setView('owner')} />
                <NavButton currentView={view} targetView="kitchen" icon={ChefHat} label="Comanda" onClick={() => setView('kitchen')} />
                <NavButton currentView={view} targetView="analytics" icon={TrendingUp} label="Estadísticas" onClick={() => setView('analytics')} />
              </div>
            </div>

            {/* 3. Right: Hamburger (Mobile) */}
            <div className="flex-1 flex justify-end items-center gap-2 sm:gap-4">
              <HeaderActions onLogout={onLogout} onChangePassword={() => setShowChangePassword(true)} />

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-100 pt-3 pb-2 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-wrap justify-center bg-slate-100/50 rounded-2xl p-1 gap-1 ring-1 ring-slate-200/60 items-center w-full min-h-10">
                <NavButton currentView={view} targetView="owner" icon={LayoutDashboard} label="Gestor"
                  onClick={() => { setView('owner'); setMobileMenuOpen(false); }} isMobile={true} />
                <NavButton currentView={view} targetView="kitchen" icon={ChefHat} label="Comanda"
                  onClick={() => { setView('kitchen'); setMobileMenuOpen(false); }} isMobile={true} />
                <NavButton currentView={view} targetView="analytics" icon={TrendingUp} label="Estadísticas"
                  onClick={() => { setView('analytics'); setMobileMenuOpen(false); }} isMobile={true} />
              </div>
            </div>
          )}
        </header>
      ) : (
        <header className="glass mx-2 sm:mx-4 lg:mx-6 mt-4 mb-2 md:mb-6 rounded-[2rem] px-6 py-2.5 shrink-0 sticky top-4 z-50 transition-all duration-500 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/chef-logo.jpg" alt="Gaspacho" className="w-10 h-10 rounded-2xl shadow-lg shadow-slate-200/50 object-cover" />
            <span className="text-brand-navy text-xl font-display font-black tracking-tighter leading-none">
              COMANDAS<span className="text-brand-red">.</span>
            </span>
          </div>

          <HeaderActions onLogout={onLogout} onChangePassword={() => setShowChangePassword(true)} />
        </header>
      )}

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {view === 'owner' && !isKitchen && <OwnerView />}
        {view === 'kitchen' && <KitchenView />}
        {view === 'analytics' && !isKitchen && <AnalyticsView />}
      </main>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}

// Sesión de Supabase Auth. undefined = todavía se está leyendo la sesión guardada.
function useSession() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => subscription.unsubscribe();
  }, []);

  return session;
}

function App() {
  const session = useSession();
  const userRole = getRole(session);

  if (session === undefined) {
    return (
      <FullScreenMessage>
        <Loader2 className="w-12 h-12 text-brand-red animate-spin" />
      </FullScreenMessage>
    );
  }

  if (session && !userRole) {
    return (
      <FullScreenMessage>
        <AlertTriangle className="w-12 h-12 text-brand-red" />
        <span className="text-brand-navy font-bold">Este usuario no tiene un rol asignado.</span>
        <span className="text-slate-400 text-xs">Asignale "owner" o "kitchen" en Supabase (ver supabase/setup.sql).</span>
        <button onClick={signOut} className="px-6 py-2 bg-brand-navy text-white rounded-xl font-bold text-sm cursor-pointer">Salir</button>
      </FullScreenMessage>
    );
  }

  return (
    <StoreProvider active={!!userRole}>
      {!userRole ? (
        <LoginView />
      ) : (
        // key: si cambia el usuario se reinicia el estado de la vista
        <AppContent key={session.user.id} userRole={userRole} onLogout={signOut} />
      )}
    </StoreProvider>
  )
}

export default App;
