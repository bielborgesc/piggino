import React, { useState } from 'react';

export function LoginForm(){
    // Estados para guardar o email e a senha que o usuário digita
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Função que será chamada quando o formulário for submetido
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Impede que a página recarregue
        setIsLoading(true);
        console.log('Tentativa de login com:', { email, password });
        
        // Simula uma chamada de API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        alert(`(Simulação) Login bem-sucedido com o email: ${email}`);
        setIsLoading(false);
    };

    return (
        <div className="bg-slate-800 text-white p-8 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700 transition-all duration-500">
            {/* Cabeçalho com o logo e título */}
            <div className="flex flex-col items-center mb-8 text-center">
                {/* *** ALTERAÇÃO AQUI *** Substituímos o ícone SVG pela sua imagem.
                  Certifique-se de que a imagem 'piggino-logo.jpg' está na pasta 'public/' do seu projeto.
                */}
                <img 
                    src="/piggino-logo.jpg" 
                    alt="Logo do Piggino" 
                    className="w-24 h-auto mb-4 rounded-lg shadow-lg"
                />
                <h1 className="text-3xl font-bold text-slate-100">Bem-vindo ao Piggino</h1>
                <p className="text-slate-400 mt-1">Controle as suas finanças com inteligência.</p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Campo de Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-700 border-slate-600 rounded-md p-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                        placeholder="seu.email@exemplo.com"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* Campo de Senha */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                        Senha
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-700 border-slate-600 rounded-md p-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* Botão de Submissão */}
                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 disabled:bg-slate-500 disabled:scale-100"
                    >
                        {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Entrar'}
                    </button>
                </div>
            </form>
            
            {/* Links Adicionais */}
            <div className="text-center mt-6">
                <a href="#" className="text-sm text-green-400 hover:text-green-300">
                    Não tem uma conta? Crie uma aqui.
                </a>
            </div>
        </div>
    );
};