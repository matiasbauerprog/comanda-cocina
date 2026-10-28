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
import UnirClientesView from './views/UnirClientesView';
import HistoryGate, { HistoryStatusPill } from './components/HistoryGate';
import HeaderKpis from './components/KpiPanel';
import Segmented from './components/ui/Segmented';
import { ToastProvider } from './components/ui/Toast';

import { ChefHat, LayoutDashboard, TrendingUp, Loader2, LogOut, KeyRound, AlertTriangle, ArrowLeft } from 'lucide-react';

// Página aparte para que el dueño una clientes duplicados (link que se comparte).
const UNIR_CLIENTES_PATH = '/unir-clientes';

function FullScreenMessage({ children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper gap-4 px-6 text-center">
      {children}
    </div>
  );
}

function Logo({ subtitle = 'Pedidos · cocina · ventas', dark = false }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <img src="/chef-logo.jpg" alt="Gaspacho" className="w-9 h-9 rounded-[10px] object-cover object-[center_30%] shrink-0" />
      <div className="flex flex-col leading-none min-w-0">
        <span className={`font-display font-extrabold text-xl tracking-[-0.03em] ${dark ? 'text-night-ink' : 'text-brand-navy'}`}>
          Gaspacho<span className="text-brand-red">.</span>
        </span>
        <span className={`text-[11px] mt-[3px] truncate ${dark ? 'text-night-ink-2' : 'text-ink-3'}`}>{subtitle}</span>
      </div>
    </div>
  );
}

function LiveIndicator({ dark = false }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${dark ? 'text-night-ink-2' : 'text-ink-2'}`}>
      <span className="w-[7px] h-[7px] rounded-full bg-live shadow-[0_0_0_3px_rgba(18,160,92,0.18)]" />
      En vivo
    </div>
  );
}

function HeaderActions({ onLogout, onChangePassword, dark = false }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onChangePassword}
        className={`w-9 h-9 rounded-[9px] flex items-center justify-center transition-colors cursor-pointer ${dark ? 'text-night-ink-2 hover:bg-night-line hover:text-night-ink' : 'text-ink-2 hover:bg-track hover:text-ink'}`}
        title="Cambiar contraseña"
      >
        <KeyRound className="w-[17px] h-[17px]" />
      </button>
      <button
        onClick={onLogout}
        className={`h-9 px-3 rounded-[9px] flex items-center gap-[7px] text-[13px] font-semibold transition-colors cursor-pointer ${dark ? 'text-[#FF8A8A] hover:bg-night-line' : 'text-danger hover:bg-danger-bg'}`}
        title="Cerrar sesión"
      >
        <LogOut className="w-4 h-4" />
        <span className="hidden sm:inline">Salir</span>
      </button>
    </div>
  );
}

function Header({ children, dark = false }) {
  return (
    <header className={`sticky top-0 z-40 backdrop-blur-[10px] border-b px-4 sm:px-6 py-3 ${dark ? 'bg-night/95 border-night-line' : 'bg-paper/[0.92] border-line'}`}>
      {children}
    </header>
  );
}

function AppContent({ userRole, onLogout }) {
  const { isInitialized, loadError, reload, pedidosActivos } = useStore();
  const [view, setView] = useState(userRole === 'kitchen' ? 'kitchen' : 'owner');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const openChangePassword = () => setShowChangePassword(true);

  if (loadError) {
    return (
      <FullScreenMessage>
        <AlertTriangle className="w-12 h-12 text-brand-red" />
        <span className="font-display font-bold text-xl text-ink">No se pudieron cargar los datos</span>
        <span className="text-ink-3 text-xs">{loadError}</span>
        <div className="flex gap-3">
          <button onClick={reload} className="h-10 px-5 bg-brand-navy text-white rounded-[10px] font-semibold text-sm cursor-pointer">Reintentar</button>
          <button onClick={onLogout} className="h-10 px-5 text-danger hover:bg-danger-bg rounded-[10px] font-semibold text-sm cursor-pointer">Salir</button>
        </div>
      </FullScreenMessage>
    );
  }

  if (!isInitialized) {
    return (
      <FullScreenMessage>
        <Loader2 className="w-10 h-10 text-brand-red animate-spin" />
        <span className="text-ink-2 text-sm font-medium">Cargando pedidos…</span>
      </FullScreenMessage>
    );
  }

  const isKitchen = userRole === 'kitchen';
  const changePasswordModal = showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />;

  if (window.location.pathname === UNIR_CLIENTES_PATH) {
    if (isKitchen) {
      return (
        <FullScreenMessage>
          <AlertTriangle className="w-12 h-12 text-brand-red" />
          <span className="text-ink font-semibold">Solo Gaspi puede usar esta página.</span>
          <button onClick={onLogout} className="h-10 px-5 bg-brand-navy text-white rounded-[10px] font-semibold text-sm cursor-pointer">Salir</button>
        </FullScreenMessage>
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-paper">
        <Header>
          <div className="flex items-center justify-between gap-3">
            <Logo subtitle="Unir clientes" />
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => window.location.assign('/')}
                className="h-9 px-3 rounded-[9px] text-ink-2 hover:bg-track hover:text-ink transition-colors flex items-center gap-2 text-[13px] font-semibold cursor-pointer"
                title="Volver a la app"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver</span>
              </button>
              <HeaderActions onLogout={onLogout} onChangePassword={openChangePassword} />
            </div>
          </div>
        </Header>
        <main className="flex-1 min-h-0 py-6">
          <HistoryGate>
            <UnirClientesView />
          </HistoryGate>
        </main>
        {changePasswordModal}
      </div>
    );
  }

  if (isKitchen) {
    return (
      <div className="min-h-screen flex flex-col bg-night">
        <Header dark>
          <div className="flex items-center justify-between gap-3">
            <Logo subtitle="Cocina" dark />
            <div className="flex items-center gap-4">
              <LiveIndicator dark />
              <HeaderActions onLogout={onLogout} onChangePassword={openChangePassword} dark />
            </div>
          </div>
        </Header>
        <main className="flex-1 min-h-0">
          <KitchenView />
        </main>
        {changePasswordModal}
      </div>
    );
  }

  const navOptions = [
    { id: 'owner', label: 'Gestor', icon: LayoutDashboard },
    { id: 'kitchen', label: 'Comanda', icon: ChefHat, badge: pedidosActivos.length },
    { id: 'analytics', label: 'Estadísticas', icon: TrendingUp },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${view === 'kitchen' ? 'bg-night' : 'bg-paper'}`}>
      <Header>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Logo />
          <Segmented options={navOptions} value={view} onChange={setView} className="order-3 w-full lg:order-none lg:w-auto" />
          <div className="flex-1" />
          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-5">
              <LiveIndicator />
              <HeaderKpis />
              <div className="w-px h-6 bg-line-strong" />
            </div>
            <HeaderActions onLogout={onLogout} onChangePassword={openChangePassword} />
          </div>
          {/* En celular los KPIs van en su propia fila */}
          <div className="order-4 w-full flex md:hidden flex-wrap items-center justify-between gap-x-4 gap-y-2 min-w-0">
            <span className="hidden min-[420px]:block"><LiveIndicator /></span>
            <HeaderKpis />
          </div>
        </div>
      </Header>

      <main className="flex-1 min-h-0">
        {view === 'owner' && <OwnerView />}
        {view === 'kitchen' && <KitchenView />}
        {view === 'analytics' && (
          <HistoryGate>
            <AnalyticsView />
          </HistoryGate>
        )}
      </main>

      {view === 'owner' && <HistoryStatusPill />}
      {changePasswordModal}
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
        <Loader2 className="w-10 h-10 text-brand-red animate-spin" />
      </FullScreenMessage>
    );
  }

  if (session && !userRole) {
    return (
      <FullScreenMessage>
        <AlertTriangle className="w-12 h-12 text-brand-red" />
        <span className="text-ink font-semibold">Este usuario no tiene un rol asignado.</span>
        <span className="text-ink-3 text-xs">Asignale "owner" o "kitchen" en Supabase (ver supabase/setup.sql).</span>
        <button onClick={signOut} className="h-10 px-5 bg-brand-navy text-white rounded-[10px] font-semibold text-sm cursor-pointer">Salir</button>
      </FullScreenMessage>
    );
  }

  return (
    <ToastProvider>
      <StoreProvider active={!!userRole}>
        {!userRole ? (
          <LoginView />
        ) : (
          // key: si cambia el usuario se reinicia el estado de la vista
          <AppContent key={session.user.id} userRole={userRole} onLogout={signOut} />
        )}
      </StoreProvider>
    </ToastProvider>
  );
}

export default App;
