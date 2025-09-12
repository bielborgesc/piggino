import React, { useState } from 'react';
import { LayoutDashboard, ArrowRightLeft, Settings, LogOut, Menu, X } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  activePage: 'dashboard' | 'transactions';
  onNavigate: (page: 'dashboard' | 'transactions') => void;
  onLogout: () => void; // 1. Receba a função de logout
}

// Sidebar permanece o mesmo, mas agora fecha ao navegar
function Sidebar({ activePage, onNavigate, onClose }: { activePage: string; onNavigate: (page: 'dashboard' | 'transactions') => void; onClose: () => void; }) {
  const handleNavigation = (page: 'dashboard' | 'transactions') => {
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
          Transações
        </button>
      </nav>
    </aside>
  );
}

// 2. Header agora recebe onLogout
function Header({ onOpenSidebar, onLogout }: { onOpenSidebar: () => void; onLogout: () => void; }) {
    return (
        <header className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <button onClick={onOpenSidebar} className="md:hidden text-slate-300 hover:text-white">
                <Menu size={24} />
            </button>
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Olá, Gabriel!</h1>
                <p className="text-slate-400 text-sm sm:text-base">Bem-vindo de volta.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* 3. Conecte a função ao onClick do botão */}
            <button onClick={onLogout} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                <LogOut className="h-5 w-5 hidden sm:block" />
                <span>Sair</span>
            </button>
          </div>
        </header>
      );
}

export function MainLayout({ children, activePage, onNavigate, onLogout }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-900 text-white">
        <div className={`fixed inset-0 z-30 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'bg-black/50' : 'bg-opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}></div>
        <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-40 md:hidden`}>
            <Sidebar activePage={activePage} onNavigate={onNavigate} onClose={() => setIsSidebarOpen(false)} />
        </div>
        <div className="hidden md:flex">
            <Sidebar activePage={activePage} onNavigate={onNavigate} onClose={() => {}} />
        </div>
      
      <main className="flex-1 flex flex-col">
        {/* 4. Passe a função onLogout para o Header */}
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} onLogout={onLogout} />
        {children}
      </main>
    </div>
  );
}