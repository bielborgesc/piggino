import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import {
  BotContext,
  BotSummary,
  ParsedTransaction,
  BotLinkTokenResponse,
} from '../types';

const BOT_SECRET_HEADER = 'X-Bot-Secret';

function createApiClient(): AxiosInstance {
  return axios.create({
    baseURL: config.pigginoApiUrl,
    headers: {
      'Content-Type': 'application/json',
      [BOT_SECRET_HEADER]: config.botSecret,
    },
  });
}

const apiClient = createApiClient();

export async function fetchUserContext(chatId: string): Promise<BotContext | null> {
  try {
    const response = await apiClient.get<BotContext>(`/api/bot/context/${chatId}`);
    return response.data;
  } catch {
    return null;
  }
}

export async function connectTelegramAccount(
  chatId: string,
  token: string,
): Promise<boolean> {
  try {
    await apiClient.post('/api/bot/connect', { chatId, token });
    return true;
  } catch {
    return false;
  }
}

export async function createTransaction(
  chatId: string,
  transaction: ParsedTransaction,
): Promise<boolean> {
  try {
    await apiClient.post('/api/bot/transaction', {
      chatId,
      description: transaction.description,
      totalAmount: transaction.totalAmount,
      transactionType: transaction.transactionType,
      categoryId: transaction.categoryId,
      financialSourceId: transaction.financialSourceId,
      purchaseDate: transaction.purchaseDate,
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchMonthlySummary(chatId: string): Promise<BotSummary | null> {
  try {
    const response = await apiClient.get<BotSummary>(`/api/bot/summary/${chatId}`);
    return response.data;
  } catch {
    return null;
  }
}

export async function generateLinkToken(jwtToken: string): Promise<BotLinkTokenResponse | null> {
  try {
    const response = await apiClient.post<BotLinkTokenResponse>(
      '/api/bot/link-token',
      {},
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );
    return response.data;
  } catch {
    return null;
  }
}
