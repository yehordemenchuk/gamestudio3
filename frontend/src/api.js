import { getRuntimeApiBase } from "./apiBase.js";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  normalizeLoginEmail,
  tryRefreshTokens
} from "./auth";

export const GAME = "slitherlink";

export const DEFAULT_SCORE_PLAYER = "Guest";

function getBaseUrl() {
  return getRuntimeApiBase();
}

let onAuthProblem = null;

export function setAuthProblemHandler(handler) {
  onAuthProblem = handler;
}

function needsAuthHeader(path, method) {
  const p = path.split("?")[0].replace(/\/+$/, "") || "/";
  if (p === "/api/v1/auth/login" || p === "/api/v1/auth/refresh") return false;
  if (method === "POST" && (p === "/api/v1/users" || p === "/api/v1/users/")) return false;
  return true;
}

function decodeJwtExpMs(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = JSON.parse(atob(b64 + pad));
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function ensureFreshAccess() {
  const access = getAccessToken();
  const rt = getRefreshToken();
  if (!rt) return;
  const exp = decodeJwtExpMs(access);
  const skew = 30_000;
  if (!access || (exp != null && exp < Date.now() + skew)) {
    await tryRefreshTokens();
  }
}

export async function fetchWithAuth(path, init = {}) {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const method = (init.method || "GET").toUpperCase();
  const useAuth = needsAuthHeader(path.split("?")[0], method);

  if (useAuth) await ensureFreshAccess();

  const build = (token) => {
    const headers = new Headers(init.headers || {});
    if (useAuth && token) headers.set("Authorization", `Bearer ${token}`);
    if (init.body != null && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return { ...init, headers };
  };

  if (!useAuth) {
    return fetch(url, build(null));
  }

  const doFetch = () => fetch(url, build(getAccessToken()));
  let res = await doFetch();
  if (res.status !== 401 && res.status !== 403) return res;

  const hadAccess = Boolean(getAccessToken());
  const hadRefresh = Boolean(getRefreshToken());

  if (hadRefresh) {
    const refreshed = await tryRefreshTokens();
    if (refreshed) {
      res = await doFetch();
      return res;
    }
    clearTokens();
    onAuthProblem?.({ reason: "expired" });
    return res;
  }

  clearTokens();
  if (hadAccess) onAuthProblem?.({ reason: "expired" });
  else onAuthProblem?.({ reason: "required" });
  return res;
}

export async function parseJson(response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function normalizeScorePayload(row) {
  if (row == null || typeof row !== "object") return row;
  const p = row.points != null ? row.points : row.score;
  return { ...row, points: p };
}

export async function loadTopScores() {
  const response = await fetchWithAuth(`/api/v1/scores`);
  const data = await parseJson(response);
  if (!Array.isArray(data)) return [];
  return data
    .filter((item) => item?.game && String(item.game).toLowerCase() === GAME.toLowerCase())
    .map(normalizeScorePayload)
    .sort((a, b) => Number(b.points ?? 0) - Number(a.points ?? 0));
}

export async function createScore({ player, points }) {
  const safePlayer = (player && String(player).trim()) || DEFAULT_SCORE_PLAYER;
  const response = await fetchWithAuth(`/api/v1/scores`, {
    method: "POST",
    body: JSON.stringify({
      game: GAME,
      player: safePlayer,
      points: Math.max(0, Math.round(Number(points))),
      playedOn: new Date().toISOString()
    })
  });
  const body = await parseJson(response);
  return normalizeScorePayload(body);
}

export async function loadComments() {
  const response = await fetchWithAuth(`/api/v1/comments`);
  const data = await parseJson(response);
  if (!Array.isArray(data)) return [];
  return data.filter((item) => item.game?.toLowerCase() === GAME);
}

export async function createComment({ player, comment }) {
  const response = await fetchWithAuth(`/api/v1/comments`, {
    method: "POST",
    body: JSON.stringify({
      game: GAME,
      player,
      comment,
      datedOn: new Date().toISOString()
    })
  });
  return parseJson(response);
}

export async function loadAverageRating() {
  const response = await fetchWithAuth(`/api/v1/ratings/avg/${GAME}`);
  return parseJson(response);
}

export async function createRating({ player, rating }) {
  const response = await fetchWithAuth(`/api/v1/ratings/`, {
    method: "POST",
    body: JSON.stringify({
      game: GAME,
      player,
      rating: Math.min(5, Math.max(0, Math.round(Number(rating)))),
      ratedOn: new Date().toISOString()
    })
  });
  return parseJson(response);
}

function escapeEmailForPathSegment(email) {
  const normalized = normalizeLoginEmail(email);
  let out = "";
  for (const ch of normalized) {
    if (ch === "@" || /[a-zA-Z0-9._+-]/.test(ch)) out += ch;
    else out += encodeURIComponent(ch);
  }
  return out;
}

export async function loadUserByEmail(email) {
  const segment = escapeEmailForPathSegment(email);
  const response = await fetchWithAuth(`/api/v1/users/${segment}`);
  return parseJson(response);
}

export async function loadAllUsers() {
  const response = await fetchWithAuth(`/api/v1/users/`);
  if (response.status === 403) return null;
  const data = await parseJson(response);
  if (!Array.isArray(data)) return [];
  return data.map((row) => {
    if (row && typeof row === "object" && row.body != null && typeof row.body === "object") return row.body;
    return row;
  });
}

export { getBaseUrl };
