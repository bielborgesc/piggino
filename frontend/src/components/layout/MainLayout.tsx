import React, { useEffect, useState } from 'react';
import { LayoutDashboard, ArrowRightLeft, LogOut, Menu, X, Shapes, Wallet, Receipt, CalendarCheck, Calculator, KeyRound, Settings, Target, TrendingUp, CreditCard } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { TokenPayload } from '../../types';
import { getAccessToken } from '../../services/api';

type PageType = 'dashboard' | 'transactions' | 'categories' | 'financial-sources' | 'invoices' | 'fixed-bills' | 'simulation' | 'goals' | 'projection' | 'debts';

interface MainLayoutProps {
  children: React.ReactNode;
  activePage: PageType;
  onNavigate: (page: PageType) => void;
  onLogout: () => Promise<void>;
  onChangePassword: () => void;
  onOpenSettings: () => void;
}

function Sidebar({ activePage, onNavigate, onClose }: { activePage: string; onNavigate: (page: PageType) => void; onClose: () => void; }) {
  const handleNavigation = (page: PageType) => {
    onNavigate(page);
    onClose();
  };

  return (
    <aside className="w-64 bg-slate-800 p-6 flex-col flex z-40 h-full">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
            <img src="/piggino-logo.jpg" alt="Piggino Logo" className="w-10 h-10 rounded-lg" />
            <span className="text-2xl font-bold text-white">Piggino</span>
        </div>
        <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
        </button>
      </div>
      <nav className="flex flex-col gap-2">
        <button
          onClick={() => handleNavigation('dashboard')}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors w-full text-left ${activePage === 'dashboard' ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </button>
        <button
          onClick={() => handleNavigation('transactions')}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors w-full text-left ${activePage === 'transactions' ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          <ArrowRightLeft className="h-5 w-5" />
          Transacoes
        </button>
        <button
          onClick={() => handleNavigation('categories')}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors w-full text-left ${activePage === 'categories' ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          <Shapes className="h-5 w-5" />
          Categorias
        </button>
        <button
          onClick={() => handleNavigation('financial-sources')}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors w-full text-left ${activePage === 'financial-sources' ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          <Wallet className="h-5 w-5" />
          Fontes Financeiras
        </button>
        <button
          onClick={() => handleNavigation('invoices')}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors w-full text-left ${activePage === 'invoices' ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          <Receipt className="h-5 w-5" />
          Faturas
        </button>
        <button
          onClick={() => handleNavigation('fixed-bills')}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors w-full text-left ${activePage === 'fixed-bills' ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          <CalendarCheck className="h-5 w-5" />
          Contas Fixas
        </button>
        <button
          onClick={() => handleNavigation('simulation')}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors w-full text-left ${activePage === 'simulation' ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          <Calculator className="h-5 w-5" />
          Simulacao
        </button>
        <button
          onClick={() => handleNavigation('goals')}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors w-full text-left ${activePage === 'goals' ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          <Target className="h-5 w-5" />
          Metas
        </button>
        <button
          onClick={() => handleNavigation('projection')}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors w-full text-left ${activePage === 'projection' ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          <TrendingUp className="h-5 w-5" />
          Projecao
        </button>
        <button
          onClick={() => handleNavigation('debts')}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors w-full text-left ${activePage === 'debts' ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          <CreditCard className="h-5 w-5" />
          Dividas
        </button>
      </nav>
    </aside>
  );
}

function Header({
  onOpenSidebar,
  onLogout,
  onChangePassword,
  onOpenSettings,
}: {
  onOpenSidebar: () => void;
  onLogout: () => Promise<void>;
  onChangePassword: () => void;
  onOpenSettings: () => void;
}) {
  const [userName, setUserName] = useState('Usuario');

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        if (decoded.name) {
          setUserName(decoded.name);
        }
      } catch (error) {
        console.error('Erro ao decodificar token', error);
      }
    }
  }, []);

  return (
    <header className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
      <div className="flex items-center gap-4">
        <button onClick={onOpenSidebar} className="md:hidden text-slate-300 hover:text-white">
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Ola, {userName}!</h1>
          <p className="text-slate-400 text-sm sm:text-base">Bem-vindo de volta.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          aria-label="Configuracoes"
        >
          <Settings className="h-5 w-5" />
          <span className="hidden sm:inline">Configuracoes</span>
        </button>
        <button
          onClick={onChangePassword}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          aria-label="Alterar senha"
        >
          <KeyRound className="h-5 w-5" />
          <span className="hidden sm:inline">Alterar senha</span>
        </button>
        <button onClick={onLogout} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
          <LogOut className="h-5 w-5 hidden sm:block" />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}

export function MainLayout({ children, activePage, onNavigate, onLogout, onChangePassword, onOpenSettings }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-900 text-white">
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'bg-black/50' : 'bg-opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-40 md:hidden`}>
        <Sidebar activePage={activePage} onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} />
      </div>
      <div className="hidden md:flex">
        <Sidebar activePage={activePage} onNavigate={onNavigate} onClose={() => {}} />
      </div>

      <main className="flex-1 flex flex-col">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onLogout={onLogout}
          onChangePassword={onChangePassword}
          onOpenSettings={onOpenSettings}
        />
        {children}
      </main>
    </div>
  );
}
