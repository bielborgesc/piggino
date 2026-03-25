import { Send, CheckCircle, Copy, RefreshCw, Loader2, Unlink, PlusCircle, X } from 'lucide-react';
import { useTelegramConnect } from '../../../hooks/useTelegramConnect';
import { TelegramConnection } from '../../../types';

const SECONDS_PER_MINUTE = 60;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatConnectionDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function StepNumber({ number }: { number: number }) {
  return (
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
      {number}
    </span>
  );
}

function CopyButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-600"
    >
      <Copy size={12} />
      Copiar
    </button>
  );
}

function ConnectionItem({
  connection,
  index,
  onDisconnect,
}: {
  connection: TelegramConnection;
  index: number;
  onDisconnect: (id: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-slate-700/50 rounded-lg">
      <div className="flex items-center gap-2">
        <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
        <div>
          <p className="text-slate-200 text-sm font-medium">Conta Telegram #{index + 1}</p>
          <p className="text-slate-500 text-xs">Conectada em {formatConnectionDate(connection.connectedAt)}</p>
        </div>
      </div>
      <button
        onClick={() => onDisconnect(connection.id)}
        aria-label="Desconectar esta conta"
        className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function TokenDisplay({
  token,
  secondsRemaining,
  onCopyToken,
  onCopyCommand,
  onRegenerateToken,
  botUsername,
}: {
  token: string;
  secondsRemaining: number;
  onCopyToken: () => void;
  onCopyCommand: () => void;
  onRegenerateToken: () => void;
  botUsername: string;
}) {
  const steps = [
    {
      label: (
        <>
          Abra o Telegram e busque por{' '}
          <span className="text-blue-400 font-medium">@{botUsername}</span>
        </>
      ),
    },
    { label: 'Inicie uma conversa clicando em Start' },
    { label: null },
    { label: 'Pronto! Sua conta estara vinculada.' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">
            Seu codigo
          </p>
          <span className="text-xs text-slate-500">
            Expira em{' '}
            <span className={secondsRemaining < 60 ? 'text-red-400' : 'text-slate-300'}>
              {formatCountdown(secondsRemaining)}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-3 border border-slate-600">
          <code className="flex-1 text-green-400 font-mono text-xs break-all leading-relaxed">
            {token}
          </code>
          <CopyButton onClick={onCopyToken} label="Copiar codigo" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">
          Passos para conectar
        </p>
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <StepNumber number={index + 1} />
              {step.label !== null ? (
                <span className="text-slate-300 text-sm leading-relaxed">{step.label}</span>
              ) : (
                <div className="flex-1 space-y-2">
                  <span className="text-slate-300 text-sm leading-relaxed">
                    Envie o comando:{' '}
                    <code className="text-green-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded text-xs">
                      /conectar SEU_TOKEN
                    </code>
                  </span>
                  <div className="flex items-center gap-2 bg-slate-900 rounded p-2 border border-slate-700">
                    <code className="flex-1 text-green-400 font-mono text-xs">
                      /conectar {token}
                    </code>
                    <CopyButton onClick={onCopyCommand} label="Copiar comando completo" />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      <button
        onClick={onRegenerateToken}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <RefreshCw size={12} />
        Gerar novo codigo
      </button>
    </div>
  );
}

function AddConnectionFlow({
  onGenerateToken,
  isGenerating,
  token,
  secondsRemaining,
  onCopyToken,
  onCopyCommand,
  botUsername,
  hasExistingConnections,
}: {
  onGenerateToken: () => void;
  isGenerating: boolean;
  token: string | null;
  secondsRemaining: number;
  onCopyToken: () => void;
  onCopyCommand: () => void;
  botUsername: string;
  hasExistingConnections: boolean;
}) {
  if (token && secondsRemaining > 0) {
    return (
      <TokenDisplay
        token={token}
        secondsRemaining={secondsRemaining}
        onCopyToken={onCopyToken}
        onCopyCommand={onCopyCommand}
        onRegenerateToken={onGenerateToken}
        botUsername={botUsername}
      />
    );
  }

  if (hasExistingConnections) {
    return (
      <button
        onClick={onGenerateToken}
        disabled={isGenerating}
        className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
      >
        {isGenerating ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <PlusCircle size={14} />
        )}
        Adicionar outra conta
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Send size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-white font-semibold">Conectar ao Telegram</p>
          <p className="text-slate-400 text-sm mt-1">
            Registre gastos e consulte seu financeiro diretamente pelo Telegram, usando linguagem
            natural.
          </p>
        </div>
      </div>

      <button
        onClick={onGenerateToken}
        disabled={isGenerating}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {isGenerating ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Send size={14} />
        )}
        Gerar codigo de conexao
      </button>
    </div>
  );
}

export function TelegramConnectCard() {
  const {
    isConnected,
    isLoadingStatus,
    connections,
    token,
    secondsRemaining,
    isGenerating,
    isDisconnecting,
    botUsername,
    generateToken,
    disconnect,
    disconnectSpecific,
    copyToken,
    copyCommand,
  } = useTelegramConnect();

  const commands = [
    'Envie uma mensagem como "gastei 50 no mercado" para registrar um gasto',
    '/resumo — ver resumo do mes atual',
    '/start — ver todos os comandos disponiveis',
  ];

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={16} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isConnected && (
        <>
          <div className="space-y-2">
            <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">
              Contas conectadas
            </p>
            <div className="space-y-2">
              {connections.map((connection, index) => (
                <ConnectionItem
                  key={connection.id}
                  connection={connection}
                  index={index}
                  onDisconnect={disconnectSpecific}
                />
              ))}
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-3 space-y-2">
            <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">
              Comandos disponiveis
            </p>
            <ul className="space-y-1.5">
              {commands.map((command) => (
                <li key={command} className="flex items-start gap-2 text-slate-400 text-sm">
                  <span className="text-blue-400 mt-0.5">•</span>
                  {command}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-700 pt-4 space-y-3">
            <AddConnectionFlow
              onGenerateToken={generateToken}
              isGenerating={isGenerating}
              token={token}
              secondsRemaining={secondsRemaining}
              onCopyToken={copyToken}
              onCopyCommand={copyCommand}
              botUsername={botUsername}
              hasExistingConnections={true}
            />

            {connections.length > 1 && (
              <button
                onClick={disconnect}
                disabled={isDisconnecting}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {isDisconnecting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Unlink size={14} />
                )}
                Desconectar tudo
              </button>
            )}
          </div>
        </>
      )}

      {!isConnected && (
        <AddConnectionFlow
          onGenerateToken={generateToken}
          isGenerating={isGenerating}
          token={token}
          secondsRemaining={secondsRemaining}
          onCopyToken={copyToken}
          onCopyCommand={copyCommand}
          botUsername={botUsername}
          hasExistingConnections={false}
        />
      )}
    </div>
  );
}
