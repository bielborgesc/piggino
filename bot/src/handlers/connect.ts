import { Context } from 'grammy';
import { connectTelegramAccount } from '../services/pigginoApi';

export async function handleConnect(ctx: Context): Promise<void> {
  const chatId = String(ctx.chat?.id);
  const messageText = ctx.message?.text ?? '';

  const parts = messageText.trim().split(/\s+/);

  if (parts.length < 2 || !parts[1]) {
    await ctx.reply(
      'Por favor, informe o token. Exemplo: /conectar SEU_TOKEN',
    );
    return;
  }

  const token = parts[1];
  const connected = await connectTelegramAccount(chatId, token);

  if (!connected) {
    await ctx.reply(
      'Token invalido ou expirado. Gere um novo token no aplicativo Piggino e tente novamente.',
    );
    return;
  }

  await ctx.reply(
    'Conta conectada com sucesso! Agora voce pode registrar transacoes.\n\n' +
    'Exemplos:\n' +
    '- "gastei 50 reais no mercado"\n' +
    '- "paguei conta de luz 89 reais"\n' +
    '- "recebi salario 3000"\n\n' +
    'Use /resumo para ver o resumo do mes.',
  );
}
