import { Context } from 'grammy';
import { fetchUserContext, createTransaction } from '../services/pigginoApi';
import { parseTransactionMessage } from '../services/gemini';
import { ParsedTransaction } from '../types';

const FALLBACK_MESSAGE =
  'Nao entendi. Tente:\n' +
  '- "gastei 50 no mercado"\n' +
  '- "paguei conta de luz 89 reais"\n' +
  '- "recebi 3000 de salario"';

const NOT_CONNECTED_MESSAGE =
  'Conta nao conectada. Use /conectar TOKEN para vincular sua conta Piggino.';

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildConfirmationMessage(
  transaction: ParsedTransaction,
  categoryName: string,
): string {
  const typeLabel = transaction.transactionType === 'Income' ? 'Receita' : 'Despesa';
  return (
    `Registrado com sucesso!\n` +
    `${typeLabel}: ${formatCurrency(transaction.totalAmount)}\n` +
    `Descricao: ${transaction.description}\n` +
    `Categoria: ${categoryName}`
  );
}

export async function handleMessage(ctx: Context): Promise<void> {
  const chatId = String(ctx.chat?.id);
  const messageText = ctx.message?.text;

  if (!messageText)
    return;

  const botContext = await fetchUserContext(chatId);

  if (!botContext) {
    await ctx.reply(NOT_CONNECTED_MESSAGE);
    return;
  }

  const { categories, financialSources } = botContext;

  if (categories.length === 0 || financialSources.length === 0) {
    await ctx.reply(
      'Voce ainda nao tem categorias ou fontes financeiras cadastradas. ' +
      'Acesse o aplicativo Piggino para criar.',
    );
    return;
  }

  const parsed = await parseTransactionMessage(messageText, categories, financialSources);

  if (!parsed) {
    await ctx.reply(FALLBACK_MESSAGE);
    return;
  }

  const recorded = await createTransaction(chatId, parsed);

  if (!recorded) {
    await ctx.reply('Ocorreu um erro ao registrar a transacao. Tente novamente.');
    return;
  }

  const matchedCategory = categories.find((c) => c.id === parsed.categoryId);
  const categoryName = matchedCategory?.name ?? 'Categoria desconhecida';

  await ctx.reply(buildConfirmationMessage(parsed, categoryName));
}
