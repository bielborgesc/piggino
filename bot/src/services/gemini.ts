import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { Category, FinancialSource, ParsedTransaction, BotSummary } from '../types';

const GEMINI_MODEL = 'gemini-1.5-flash';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

function buildTransactionParsingPrompt(
  message: string,
  categories: Category[],
  financialSources: FinancialSource[],
): string {
  const today = new Date().toISOString().split('T')[0];
  const categoriesList = categories
    .map((c) => `  - id: ${c.id}, nome: "${c.name}", tipo: "${c.type}"`)
    .join('\n');
  const sourcesList = financialSources
    .map((s) => `  - id: ${s.id}, nome: "${s.name}"`)
    .join('\n');

  return `
Você é um assistente financeiro especializado em interpretar mensagens informais em português brasileiro.

Sua tarefa é analisar a mensagem do usuário e identificar se ela descreve uma transação financeira.

Categorias disponíveis:
${categoriesList}

Fontes financeiras disponíveis:
${sourcesList}

Data de hoje: ${today}

Mensagem do usuário: "${message}"

Instruções:
1. Se a mensagem descreve uma transação financeira, retorne um JSON com os campos abaixo.
2. Identifique se é uma despesa (Expense) ou receita (Income).
   - Palavras como "gastei", "paguei", "comprei", "conta", "parcela" = Expense
   - Palavras como "recebi", "salário", "renda", "entrou" = Income
3. Escolha a categoria mais adequada pelo nome (escolha a mais próxima semanticamente).
4. Se nenhuma fonte financeira for mencionada, use a primeira da lista (id: ${financialSources[0]?.id ?? 0}).
5. Se nenhuma data for mencionada, use a data de hoje (${today}).
6. O campo "description" deve ser um resumo curto e claro em português, com no máximo 100 caracteres.
7. Se a mensagem NÃO descreve uma transação financeira, retorne exatamente a palavra: null

Formato do JSON de saída (sem markdown, sem bloco de código, apenas o JSON puro):
{
  "description": "descrição curta",
  "totalAmount": 0.00,
  "transactionType": "Expense" ou "Income",
  "categoryId": 0,
  "financialSourceId": 0,
  "purchaseDate": "YYYY-MM-DD"
}
`.trim();
}

export async function parseTransactionMessage(
  message: string,
  categories: Category[],
  financialSources: FinancialSource[],
): Promise<ParsedTransaction | null> {
  if (categories.length === 0 || financialSources.length === 0)
    return null;

  const prompt = buildTransactionParsingPrompt(message, categories, financialSources);

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    if (rawText === 'null' || rawText === '')
      return null;

    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed: unknown = JSON.parse(cleaned);

    return validateParsedTransaction(parsed, categories, financialSources);
  } catch {
    return null;
  }
}

function validateParsedTransaction(
  raw: unknown,
  categories: Category[],
  financialSources: FinancialSource[],
): ParsedTransaction | null {
  if (typeof raw !== 'object' || raw === null)
    return null;

  const obj = raw as Record<string, unknown>;

  const description = typeof obj['description'] === 'string' ? obj['description'] : null;
  const totalAmount = typeof obj['totalAmount'] === 'number' ? obj['totalAmount'] : null;
  const transactionType = obj['transactionType'] === 'Income' || obj['transactionType'] === 'Expense'
    ? obj['transactionType']
    : null;
  const categoryId = typeof obj['categoryId'] === 'number' ? obj['categoryId'] : null;
  const financialSourceId = typeof obj['financialSourceId'] === 'number' ? obj['financialSourceId'] : null;
  const purchaseDate = typeof obj['purchaseDate'] === 'string' ? obj['purchaseDate'] : null;

  if (!description || totalAmount === null || !transactionType || !categoryId || !financialSourceId || !purchaseDate)
    return null;

  if (totalAmount <= 0)
    return null;

  const categoryExists = categories.some((c) => c.id === categoryId);
  const sourceExists = financialSources.some((s) => s.id === financialSourceId);

  if (!categoryExists || !sourceExists)
    return null;

  return {
    description,
    totalAmount,
    transactionType,
    categoryId,
    financialSourceId,
    purchaseDate,
  };
}

export function generateSummaryMessage(summary: BotSummary): string {
  const formatCurrency = (value: number): string =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const balanceSign = summary.balance >= 0 ? '+' : '';
  const balanceEmoji = summary.balance >= 0 ? 'verde' : 'vermelho';

  const topCategoriesText =
    summary.topCategories.length > 0
      ? summary.topCategories
          .map((c, i) => `  ${i + 1}. ${c.name}: ${formatCurrency(c.amount)}`)
          .join('\n')
      : '  Nenhuma despesa registrada.';

  return (
    `Resumo do mês atual:\n\n` +
    `Receitas: ${formatCurrency(summary.monthlyIncome)}\n` +
    `Despesas: ${formatCurrency(summary.monthlyExpenses)}\n` +
    `Saldo: ${balanceSign}${formatCurrency(summary.balance)} (${balanceEmoji})\n\n` +
    `Maiores gastos por categoria:\n${topCategoriesText}`
  );
}
