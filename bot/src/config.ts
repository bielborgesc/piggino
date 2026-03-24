function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const config = {
  telegramBotToken: requireEnv('TELEGRAM_BOT_TOKEN'),
  geminiApiKey: requireEnv('GEMINI_API_KEY'),
  pigginoApiUrl: requireEnv('PIGGINO_API_URL'),
  botSecret: requireEnv('BOT_SECRET'),
} as const;
