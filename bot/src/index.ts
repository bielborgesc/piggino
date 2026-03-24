import { Bot } from 'grammy';
import { config } from './config';
import { handleStart } from './handlers/start';
import { handleConnect } from './handlers/connect';
import { handleSummary } from './handlers/summary';
import { handleMessage } from './handlers/message';

function createBot(): Bot {
  const bot = new Bot(config.telegramBotToken);

  bot.command('start', handleStart);
  bot.command('conectar', handleConnect);
  bot.command('resumo', handleSummary);
  bot.on('message:text', handleMessage);

  return bot;
}

async function main(): Promise<void> {
  console.log('Starting Piggino Telegram bot...');

  const bot = createBot();

  bot.catch((error) => {
    console.error('Bot error:', error);
  });

  await bot.start();
}

main().catch((error) => {
  console.error('Fatal error during bot startup:', error);
  process.exit(1);
});
