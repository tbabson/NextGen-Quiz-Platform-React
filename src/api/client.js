/**
 * Thin fetch wrapper for the PUNCH API.
 *
 * - The access token lives only in memory (never localStorage), so XSS can't lift a long-lived credential.
 * - The refresh token is an httpOnly cookie scoped to /api/auth; we just send credentials.
 * - Refreshes are single-flight: the API treats two concurrent refreshes with the same cookie as token
 *   theft and revokes the session, so every caller (and React StrictMode double effects) shares one promise.
 */

const BASE = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api`;

let accessToken = null;
let refreshInFlight = null;
let onSessionLost = () => {};

export class ApiError extends Error {
  constructor(status, { code = 'UNKNOWN', message = 'Something went wrong.', details = [] } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Field errors as { field: message }, for forms. */
  get fieldErrors() {
    return Object.fromEntries(this.details.filter((d) => d.field).map((d) => [d.field, d.message]));
  }
}

export function setAccessToken(token) {
  accessToken = token;
}

export function setSessionLostHandler(handler) {
  onSessionLost = handler;
}

async function parse(res) {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function raw(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(auth && accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, { code: 'NETWORK_ERROR', message: "Can't reach the server. Check your connection and try again." });
  }

  const data = await parse(res);
  if (!res.ok) {
    if (res.status === 429) {
      throw new ApiError(429, { code: 'RATE_LIMITED', message: data?.error?.message ?? 'Whoa, slow down! Try again in a minute.' });
    }
    throw new ApiError(res.status, data?.error ?? { message: `Request failed (${res.status}).` });
  }
  return { data, headers: res.headers, status: res.status };
}

/** Rotates the refresh cookie and stores the new access token. Concurrent callers share one request. */
export function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = raw('/auth/refresh', { method: 'POST', auth: false })
      .then(({ data }) => {
        accessToken = data.access_token;
        return data;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

const RETRYABLE_AUTH = new Set(['TOKEN_EXPIRED', 'INVALID_TOKEN', 'UNAUTHENTICATED']);

/** Authenticated request: on an expired/invalid token, refresh once and retry. */
export async function request(path, options = {}) {
  try {
    return await raw(path, options);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !RETRYABLE_AUTH.has(error.code)) throw error;
    try {
      await refreshSession();
    } catch {
      accessToken = null;
      onSessionLost();
      throw error;
    }
    return raw(path, options);
  }
}

const get = async (path) => (await request(path)).data;

export const api = {
  // Auth
  register: async (body) => (await raw('/auth/register', { method: 'POST', body, auth: false })).data,
  login: async (body) => (await raw('/auth/login', { method: 'POST', body, auth: false })).data,
  logout: () => raw('/auth/logout', { method: 'POST', auth: false }),
  /** Signs out every other device and returns a fresh session for this one. */
  changePassword: async (body) => (await request('/auth/change-password', { method: 'POST', body })).data,

  // Profile
  profile: () => get('/me'),
  updateProfile: async (body) => (await request('/me', { method: 'PATCH', body })).data,

  // Data
  dashboard: () => get('/me/dashboard'),
  quizzes: async () => (await get('/quizzes')).quizzes,
  quiz: (id) => get(`/quizzes/${id}`),
  attempts: async ({ limit = 50, offset = 0 } = {}) => (await get(`/attempts?limit=${limit}&offset=${offset}`)).attempts,
  attempt: (id) => get(`/attempts/${id}`),
  leaderboard: (limit = 20) => get(`/leaderboard?limit=${limit}`),

  /** Returns { result, replayed }. Reuse the same idempotencyKey when retrying the same submission. */
  submitQuiz: async (id, answers, idempotencyKey) => {
    const { data, headers } = await request(`/quizzes/${id}/submit`, {
      method: 'POST',
      body: { answers },
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return { result: data, replayed: headers.get('Idempotent-Replayed') === 'true' };
  },
};
