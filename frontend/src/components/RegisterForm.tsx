import React, { useState } from 'react';
import { registerUser } from '../services/api'; // 1. Importe a função da API
import { UserRegistrationData } from '../types'; // Importe o tipo

interface RegisterFormProps {
  onNavigateToLogin: () => void;
}

export function RegisterForm({ onNavigateToLogin }: RegisterFormProps) {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null); // Estado para mensagens de erro

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            setIsLoading(false);
            return;
        }

        const userData: UserRegistrationData = { name, email, password };

        try {
            // 2. Chame a função da API real
            await registerUser(userData);
            alert(`Usuário ${name} criado com sucesso! Agora pode fazer login.`);
            
            // Limpa o formulário e navega para a tela de login
            setName('');
            setEmail('');
            setPassword('');
            onNavigateToLogin();

        } catch (apiError: any) {
            // 3. Trate os erros vindos do backend
            console.error('Erro no cadastro:', apiError);
            if (apiError.response && apiError.response.data) {
                // Tenta extrair mensagens de erro de validação do .NET
                const errorData = apiError.response.data;
                if (errorData.errors) {
                    const messages = Object.values(errorData.errors).flat();
                    setError(messages.join(' '));
                } else {
                    setError('Ocorreu um erro. Verifique os dados e tente novamente.');
                }
            } else {
                setError('Não foi possível conectar ao servidor.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 text-white p-8 rounded-xl shadow-2xl w-full max-w-sm border border-slate-700 transition-all duration-500">
            <div className="flex flex-col items-center mb-8 text-center">
                <img 
                    src="/piggino-logo.jpg" 
                    alt="Logo do Piggino" 
                    className="w-24 h-auto mb-4 rounded-lg shadow-lg"
                />
                <h1 className="text-3xl font-bold text-slate-100">Crie a sua conta</h1>
                <p className="text-slate-400 mt-1">Comece a organizar as suas finanças hoje mesmo.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ... (campos do formulário permanecem os mesmos) ... */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                        Nome
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-700 border-slate-600 rounded-md p-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                        placeholder="Seu nome completo"
                        required
                        disabled={isLoading}
                    />
                </div>

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
                        placeholder="•••••••• (mínimo 6 caracteres)"
                        required
                        disabled={isLoading}
                    />
                </div>

                {/* 4. Exiba a mensagem de erro, se houver */}
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

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
                        ) : 'Criar Conta'}
                    </button>
                </div>
            </form>
            
            <div className="text-center mt-6">
                <button onClick={onNavigateToLogin} className="text-sm text-green-400 hover:text-green-300 bg-transparent border-none cursor-pointer">
                    Já tem uma conta? Faça login aqui.
                </button>
            </div>
        </div>
    );
};