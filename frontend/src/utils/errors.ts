import { isAxiosError, AxiosError } from 'axios';

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Dados inválidos. Verifique os campos preenchidos.',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Registro não encontrado.',
  409: 'Este registro já existe.',
  422: 'Os dados enviados são inválidos.',
  500: 'Erro interno do servidor. Tente novamente mais tarde.',
};

function extractMessageFromBody(data: unknown): string | null {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  const body = data as Record<string, unknown>;

  if (typeof body['message'] === 'string' && body['message'].length > 0) {
    return body['message'];
  }

  const validationErrors = body['errors'];
  if (validationErrors !== null && typeof validationErrors === 'object' && !Array.isArray(validationErrors)) {
    const messages = Object.values(validationErrors as Record<string, string[]>)
      .flat()
      .filter((msg): msg is string => typeof msg === 'string');

    if (messages.length > 0) {
      return messages.join(' ');
    }
  }

  return null;
}

function resolveAxiosMessage(error: AxiosError): string | null {
  const bodyMessage = extractMessageFromBody(error.response?.data);
  if (bodyMessage !== null) {
    return bodyMessage;
  }

  const status = error.response?.status;
  if (status !== undefined && HTTP_STATUS_MESSAGES[status] !== undefined) {
    return HTTP_STATUS_MESSAGES[status];
  }

  return null;
}

/**
 * Extracts a human-readable, actionable error message from an unknown error value.
 *
 * Priority order:
 * 1. Axios error with a `message` string in the response body
 * 2. Axios error with ASP.NET validation `errors` object — joined into one string
 * 3. Axios error matched by HTTP status code to a known message
 * 4. Plain Error instance — uses its message
 * 5. Falls back to the provided fallback string
 */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    return resolveAxiosMessage(error) ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
