import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.join(rootDir, "certs");

function devWantsHttpOnly(env) {
  const v = String(env.VITE_DEV_HTTP ?? process.env.VITE_DEV_HTTP ?? "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function devWantsSslFromCertsDir(env) {
  const v = String(env.VITE_DEV_SSL_FROM_CERTS ?? "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function resolveUserPemPair(env) {
  const keyEnv = (env.VITE_SSL_KEY ?? process.env.VITE_SSL_KEY)?.trim();
  const certEnv = (env.VITE_SSL_CERT ?? process.env.VITE_SSL_CERT)?.trim();
  if (keyEnv && certEnv) {
    const keyPath = path.isAbsolute(keyEnv) ? keyEnv : path.join(rootDir, keyEnv);
    const certPath = path.isAbsolute(certEnv) ? certEnv : path.join(rootDir, certEnv);
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
        label: `${path.basename(keyPath)} + ${path.basename(certPath)}`
      };
    }
    throw new Error(
      `[vite] VITE_SSL_KEY / VITE_SSL_CERT: файли не знайдено.\n  key: ${keyPath}\n  cert: ${certPath}`
    );
  }

  if (!devWantsSslFromCertsDir(env)) return null;
  if (!fs.existsSync(certsDir)) return null;

  const namedPairs = [
    ["localhost-key.pem", "localhost.pem"],
    ["localhost+1-key.pem", "localhost+1.pem"],
    ["localhost+2-key.pem", "localhost+2.pem"],
    ["localhost+3-key.pem", "localhost+3.pem"]
  ];
  for (const [keyFile, certFile] of namedPairs) {
    const keyPath = path.join(certsDir, keyFile);
    const certPath = path.join(certsDir, certFile);
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
        label: `${keyFile} + ${certFile}`
      };
    }
  }

  for (const name of fs.readdirSync(certsDir)) {
    if (!name.endsWith("-key.pem")) continue;
    const base = name.slice(0, -"-key.pem".length);
    const certName = `${base}.pem`;
    const keyPath = path.join(certsDir, name);
    const certPath = path.join(certsDir, certName);
    if (fs.existsSync(certPath)) {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
        label: `${name} + ${certName}`
      };
    }
  }

  return null;
}

export default defineConfig(({ mode, command }) => {
  const env = { ...loadEnv(mode, rootDir, ""), ...process.env };
  const httpOnly = devWantsHttpOnly(env);
  const pem = httpOnly ? null : resolveUserPemPair(env);
  const useUserPem = Boolean(pem);

  const httpsDev = httpOnly ? false : useUserPem ? { key: pem.key, cert: pem.cert } : true;

  const devInfoPlugin = {
    name: "vite-https-info",
    configureServer() {
      if (httpOnly) {
        console.info("[vite] HTTP (VITE_DEV_HTTP=1)");
      } else if (useUserPem) {
        console.info(`[vite] HTTPS: власні PEM (${pem.label})`);
      } else {
        console.info(
          "[vite] HTTPS: vite-plugin-mkcert. Якщо раніше був ERR_CERT — файли в frontend/certs/ більше не підхоплюються автоматично; свій CA у Windows або VITE_DEV_SSL_FROM_CERTS=1."
        );
      }
    }
  };

  const useMkcertPlugin = command === "serve" && !httpOnly && !useUserPem;
  const plugins = [
    react(),
    ...(useMkcertPlugin ? [mkcert({ hosts: ["localhost", "127.0.0.1", "::1"] })] : []),
    devInfoPlugin
  ];

  return {
    plugins,
    server: {
      host: "localhost",
      port: 5173,
      strictPort: true,
      https: httpsDev,
      proxy: {
        "/api": {
          target: "https://localhost:8080",
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      host: "localhost",
      port: 4173,
      strictPort: true,
      https: httpsDev,
      proxy: {
        "/api": {
          target: "https://localhost:8080",
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
