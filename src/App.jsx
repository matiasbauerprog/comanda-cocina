import { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './store/useStore';
import OwnerView from './views/OwnerView';
import KitchenView from './views/KitchenView';
import AnalyticsView from './views/AnalyticsView';
import LoginView from './views/LoginView';

import { ChefHat, LayoutDashboard, Menu, X, TrendingUp, Loader2, LogOut } from 'lucide-react';

// EXPLICACIÓN: Se crea un componente reutilizable para los botones de navegación.
// Esto evita repetir la estructura y los estilos hasta seis veces en el componente AppContent.
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

function AppContent({ userRole, onLogout }) {
  const { isInitialized } = useStore();
  const [view, setView] = useState(userRole === 'kitchen' ? 'kitchen' : 'owner');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <button
                onClick={onLogout}
                className="p-2 sm:px-4 sm:py-2 rounded-xl text-brand-red hover:bg-brand-red/10 transition-colors flex items-center gap-2 text-sm font-bold tracking-wider uppercase cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Salir</span>
              </button>

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

          <button
            onClick={onLogout}
            className="p-2 sm:px-4 sm:py-2 rounded-xl text-brand-red hover:bg-brand-red/10 transition-colors flex items-center gap-2 text-sm font-bold tracking-wider uppercase cursor-pointer"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {view === 'owner' && !isKitchen && <OwnerView />}
        {view === 'kitchen' && <KitchenView />}
        {view === 'analytics' && !isKitchen && <AnalyticsView />}
      </main>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Initialize from SessionStorage
  useEffect(() => {
    const storedRole = sessionStorage.getItem('gaspacho_role');
    if (storedRole) {
      setIsAuthenticated(true);
      setUserRole(storedRole);
    }
  }, []);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    sessionStorage.setItem('gaspacho_role', role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    sessionStorage.removeItem('gaspacho_role');
  };

  return (
    <StoreProvider active={isAuthenticated}>
      {!isAuthenticated ? (
        <LoginView onLogin={handleLogin} />
      ) : (
        <AppContent userRole={userRole} onLogout={handleLogout} />
      )}
    </StoreProvider>
  )
}

export default App;
