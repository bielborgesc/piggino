// 1. Importe os ícones que vamos usar diretamente da biblioteca
import { LayoutDashboard, ArrowRightLeft, Settings, LogOut } from 'lucide-react';

// --- Componente: Sidebar (Barra de Navegação Lateral) ---
function Sidebar() {
  return (
    <aside className="w-64 bg-slate-800 p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-10">
        <img src="/piggino-logo.jpg" alt="Piggino Logo" className="w-10 h-10 rounded-lg" />
        <span className="text-2xl font-bold text-white">Piggino</span>
      </div>
      <nav className="flex flex-col gap-2">
        {/* 2. Substitua os SVGs pelos componentes de ícone */}
        <a href="#" className="flex items-center gap-3 px-4 py-2 text-slate-100 bg-green-600 rounded-lg font-semibold">
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">
          <ArrowRightLeft className="h-5 w-5" />
          Transações
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors">
          <Settings className="h-5 w-5" />
          Configurações
        </a>
      </nav>
    </aside>
  );
}

// --- Componente: Header (Cabeçalho Superior) ---
function Header() {
  return (
    <header className="flex items-center justify-between p-6 border-b border-slate-700">
      <div>
        <h1 className="text-2xl font-bold text-white">Olá, Gabriel!</h1>
        <p className="text-slate-400">Aqui está o resumo das suas finanças.</p>
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

// --- Componente Principal: Dashboard ---
export function Dashboard() {
  // Dados mockados para a UI
  const mockTransactions = [
    { id: 1, description: 'Salário Mensal', amount: 5000.00, type: 'income', date: '01/08/2025' },
    { id: 2, description: 'Aluguel', amount: -1500.00, type: 'expense', date: '05/08/2025' },
    { id: 3, description: 'Supermercado', amount: -450.75, type: 'expense', date: '10/08/2025' },
    { id: 4, description: 'Venda de item usado', amount: 200.00, type: 'income', date: '12/08/2025' },
  ];

  const balance = 3249.25;
  const income = 5200.00;
  const expenses = 1950.75;

  return (
    <div className="flex h-screen w-full bg-slate-900 text-white">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Seção de Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h3 className="text-slate-400 text-sm">Saldo Atual</h3>
              <p className="text-3xl font-bold text-white mt-2">R$ {balance.toFixed(2)}</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h3 className="text-slate-400 text-sm">Receitas do Mês</h3>
              <p className="text-3xl font-bold text-green-400 mt-2">R$ {income.toFixed(2)}</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h3 className="text-slate-400 text-sm">Despesas do Mês</h3>
              <p className="text-3xl font-bold text-red-400 mt-2">R$ {expenses.toFixed(2)}</p>
            </div>
          </div>

          {/* Seção de Ações Rápidas e Transações Recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-4">Transações Recentes</h3>
              <div className="space-y-4">
                {mockTransactions.map(t => (
                  <div key={t.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{t.description}</p>
                      <p className="text-sm text-slate-400">{t.date}</p>
                    </div>
                    <p className={`font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {Math.abs(t.amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col justify-center items-center">
                <h3 className="text-xl font-bold mb-4">Ações Rápidas</h3>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300">
                    + Adicionar Transação
                </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}