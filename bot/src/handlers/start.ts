import { Context } from 'grammy';

export async function handleStart(ctx: Context): Promise<void> {
  const welcomeMessage =
    `Olá! Sou o Piggino, seu assistente financeiro pessoal.\n\n` +
    `Para começar, você precisa conectar sua conta do Piggino.\n\n` +
    `Como conectar:\n` +
    `1. Abra o aplicativo Piggino\n` +
    `2. Vá em Configurações e gere um token de conexão\n` +
    `3. Envie aqui: /conectar SEU_TOKEN\n\n` +
    `Após conectar, você poderá:\n` +
    `- Registrar gastos: "gastei 50 no mercado"\n` +
    `- Registrar receitas: "recebi salário 3000"\n` +
    `- Ver resumo mensal: /resumo`;

  await ctx.reply(welcomeMessage);
}
