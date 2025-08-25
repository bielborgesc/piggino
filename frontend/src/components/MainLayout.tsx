import React from 'react';
import { LayoutDashboard, ArrowRightLeft, Settings, LogOut } from 'lucide-react';

// Tipos para as props
interface MainLayoutProps {
  children: React.ReactNode;
  activePage: 'dashboard' | 'transactions';
  onNavigate: (page: 'dashboard' | 'transactions') => void;
}

// O Sidebar agora recebe props para saber qual página está ativa e para navegar
function Sidebar({ activePage, onNavigate }: { activePage: string; onNavigate: (page: 'dashboard' | 'transactions') => void; }) {
  return (
    <aside className="w-64 bg-slate-800 p-6 flex-col hidden md:flex">
      <div className="flex items-center gap-3 mb-10">
        <img src="/piggino-logo.jpg" alt="Piggino Logo" className="w-10 h-10 rounded-lg" />
        <span className="text-2xl font-bold text-white">Piggino</span>
      </div>
      <nav className="flex flex-col gap-2">
        <button 
          onClick={() => onNavigate('dashboard')}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors w-full text-left ${activePage === 'dashboard' ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </button>
        <button 
          onClick={() => onNavigate('transactions')}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors w-full text-left ${activePage === 'transactions' ? 'bg-green-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          <ArrowRightLeft className="h-5 w-5" />
          Transações
        </button>
        {/* Adicione mais botões de navegação aqui no futuro */}
      </nav>
    </aside>
  );
}

function Header() {
    // ... (O componente Header permanece o mesmo)
    return (
        <header className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h1 className="text-2xl font-bold text-white">Olá, Gabriel!</h1>
            <p className="text-slate-400">Bem-vindo de volta.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                <LogOut className="h-5 w-5" />
                Sair
            </button>
          </div>
        </header>
      );
}

export function MainLayout({ children, activePage, onNavigate }: MainLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-slate-900 text-white">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <main className="flex-1 flex flex-col">
        <Header />
        {children}
      </main>
    </div>
  );
}