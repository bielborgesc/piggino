import { Context } from 'grammy';
import { fetchMonthlySummary } from '../services/pigginoApi';
import { generateSummaryMessage } from '../services/gemini';

export async function handleSummary(ctx: Context): Promise<void> {
  const chatId = String(ctx.chat?.id);
  const summary = await fetchMonthlySummary(chatId);

  if (!summary) {
    await ctx.reply(
      'Conta nao conectada. Use /conectar TOKEN para vincular sua conta Piggino.',
    );
    return;
  }

  const message = generateSummaryMessage(summary);
  await ctx.reply(message);
}
