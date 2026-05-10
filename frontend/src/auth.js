import bcrypt from "bcryptjs";
import { getRuntimeApiBase } from "./apiBase.js";

const ACCESS = "slitherlink_access";
const REFRESH = "slitherlink_refresh";

const BCRYPT_ROUNDS = 10;

function apiBase() {
  return getRuntimeApiBase();
}

let refreshPromise = null;

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS);
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH);
}

export function persistTokens(accessToken, refreshToken) {
  if (accessToken) sessionStorage.setItem(ACCESS, accessToken);
  else sessionStorage.removeItem(ACCESS);
  if (refreshToken) sessionStorage.setItem(REFRESH, refreshToken);
  else sessionStorage.removeItem(REFRESH);
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS);
  sessionStorage.removeItem(REFRESH);
}

export function isLoggedIn() {
  return Boolean(getAccessToken() || getRefreshToken());
}

export function getEmailFromAccessToken() {
  const token = getAccessToken();
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const payload = JSON.parse(atob(b64 + pad));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function tryRefreshTokens() {
  const rt = getRefreshToken();
  if (!rt) return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${apiBase()}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt })
        });
        if (!res.ok) return false;
        const data = await res.json();
        persistTokens(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function loginUser(email, password) {
  const res = await fetch(`${apiBase()}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  const data = JSON.parse(text);
  persistTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function registerUser({ username, email, password }) {
  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  const res = await fetch(`${apiBase()}/api/v1/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      email,
      password: passwordHash,
      userRole: "ROLE_USER"
    })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return text ? JSON.parse(text) : null;
}

export async function logoutUser() {
  const rt = getRefreshToken();
  if (rt) {
    try {
      await fetch(`${apiBase()}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt })
      });
    } catch {

    }
  }
  clearTokens();
}
