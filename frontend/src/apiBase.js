const DEFAULT_HTTPS_API = "https://localhost:8080";
const SAME_ORIGIN_SENTINEL = "same-origin";

export function getRuntimeApiBase() {
  if (typeof window !== "undefined") {
    const { hostname, port } = window.location;
    const h = hostname.toLowerCase();
    const localHost = h === "localhost" || h === "127.0.0.1" || h === "[::1]";
    if (localHost && (port === "5173" || port === "4173")) {
      return "";
    }
  }

  let raw = import.meta.env.VITE_API_BASE_URL?.trim();
  if (raw) {
    if (raw.toLowerCase() === SAME_ORIGIN_SENTINEL) return "";
    raw = raw.replace(/\/$/, "");
    if (
      import.meta.env.DEV &&
      /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):8080(\/.*)?$/i.test(raw)
    ) {
      return "";
    }
    return raw;
  }

  if (import.meta.env.DEV) return "";
  return DEFAULT_HTTPS_API.replace(/\/$/, "");
}
