// In production set VITE_API_BASE_URL to the deployed backend origin.
// In development it stays empty and Vite proxies /api to Spring Boot.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export const DEFAULT_COOLDOWN_SECONDS = 60;

export class ApiError extends Error {
  constructor(message, { status = 0, retryAfterSeconds = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Tells the backend the "Me gussa hoo" button was clicked.
 * The backend sends the email; no credentials ever exist in the browser.
 */
export async function notifyAngry() {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/interaction/angry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'welcome-card' }),
    });
  } catch {
    throw new ApiError("Can't reach the server right now. Please try again in a bit.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON body (e.g. a proxy error page); fall through to the generic message.
  }

  if (!response.ok || !data?.success) {
    throw new ApiError(data?.message || 'Something went wrong. Please try again.', {
      status: response.status,
      retryAfterSeconds: data?.retryAfterSeconds ?? null,
    });
  }

  return data;
}
