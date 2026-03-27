import React, { useEffect, useState } from 'react';
import { LayoutDashboard, ArrowRightLeft, LogOut, Menu, X, Shapes, Wallet, Receipt, CalendarCheck, Settings, Target, TrendingUp, CreditCard, BookOpen } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { TokenPayload } from '../../types';
import { getAccessToken } from '../../services/api';

type PageType = 'dashboard' | 'transactions' | 'categories' | 'financial-sources' | 'invoices' | 'fixed-bills' | 'goals' | 'projection' | 'debts' | 'budgets' | 'onboarding';

interface MainLayoutProps {
  children: React.ReactNode;
  activePage: PageType;
  onNavigate: (page: PageType) => void;
  onLogout: () => Promise<void>;
  onOpenSettings: () => void;
}

interface NavItem {
  page: PageType;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Principal',
    items: [
      { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
      { page: 'transactions', label: 'Transações', icon: <ArrowRightLeft className="h-5 w-5" /> },
      { page: 'invoices', label: 'Fatura', icon: <Receipt className="h-5 w-5" /> },
      { page: 'fixed-bills', label: 'Contas Fixas', icon: <CalendarCheck className="h-5 w-5" /> },
    ],
  },
  {
    label: 'Planejamento',
    items: [
      { page: 'goals', label: 'Metas', icon: <Target className="h-5 w-5" /> },
      { page: 'budgets', label: 'Orçamentos', icon: <BookOpen className="h-5 w-5" /> },
      { page: 'debts', label: 'Dívidas', icon: <CreditCard className="h-5 w-5" /> },
      { page: 'projection', label: 'Projeção de Patrimônio', icon: <TrendingUp className="h-5 w-5" /> },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { page: 'categories', label: 'Categorias', icon: <Shapes className="h-5 w-5" /> },
      { page: 'financial-sources', label: 'Fontes Financeiras', icon: <Wallet className="h-5 w-5" /> },
    ],
  },
];

function NavButton({ item, isActive, onNavigate }: { item: NavItem; isActive: boolean; onNavigate: (page: PageType) => void }) {
  return (
    <button
      onClick={() => onNavigate(item.page)}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors w-full text-left ${
        isActive ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700'
      }`}
    >
      {item.icon}
      {item.label}
    </button>
  );
}

function Sidebar({ activePage, onNavigate, onClose }: { activePage: string; onNavigate: (page: PageType) => void; onClose: () => void }) {
  const handleNavigation = (page: PageType) => {
    onNavigate(page);
    onClose();
  };

  return (
    <aside className="w-64 bg-slate-800 p-6 flex-col flex z-40 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <img src="/piggino-logo.jpg" alt="Piggino Logo" className="w-10 h-10 rounded-lg" />
          <span className="text-2xl font-bold text-white">Piggino</span>
        </div>
        <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <nav className="flex flex-col gap-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 px-4 mb-2">
              {section.label}
            </p>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => (
                <NavButton
                  key={item.page}
                  item={item}
                  isActive={activePage === item.page}
                  onNavigate={handleNavigation}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function Header({
  onOpenSidebar,
  onLogout,
  onOpenSettings,
}: {
  onOpenSidebar: () => void;
  onLogout: () => Promise<void>;
  onOpenSettings: () => void;
}) {
  const [userName, setUserName] = useState('Usuário');

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
          <h1 className="text-xl sm:text-2xl font-bold text-white">Olá, {userName}!</h1>
          <p className="text-slate-400 text-sm sm:text-base">Bem-vindo de volta.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          aria-label="Configurações"
        >
          <Settings className="h-5 w-5" />
          <span className="hidden sm:inline">Configurações</span>
        </button>
        <button onClick={onLogout} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
          <LogOut className="h-5 w-5 hidden sm:block" />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}

export function MainLayout({ children, activePage, onNavigate, onLogout, onOpenSettings }: MainLayoutProps) {
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

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onLogout={onLogout}
          onOpenSettings={onOpenSettings}
        />
        {children}
      </main>
    </div>
  );
}
