import { HttpError } from './http.ts';

export async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 20_000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      const text = (await response.text()).slice(0, 1000);
      throw new HttpError(502, `Provider request failed (${response.status}): ${text}`, 'provider_error');
    }
    return response;
  } finally { clearTimeout(timeout); }
}
