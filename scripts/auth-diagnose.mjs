#!/usr/bin/env node
/**
 * Auth diagnostic script — checks env, Firebase Admin, session route, middleware.
 * Run: node scripts/auth-diagnose.mjs
 * With live server: BASE_URL=http://localhost:3000 node scripts/auth-diagnose.mjs
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const REQUIRED_CLIENT = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const REQUIRED_SERVER = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "DATABASE_URL",
];

function loadDotEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = join(ROOT, name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
    console.log(`Loaded env from ${name}`);
  }
}

function mask(val) {
  if (!val) return "(missing)";
  if (val.length <= 8) return "***";
  return `${val.slice(0, 4)}…${val.slice(-4)} (${val.length} chars)`;
}

function checkEnvVars() {
  console.log("\n=== 1. Environment variables ===\n");
  const results = [];
  for (const key of [...REQUIRED_CLIENT, ...REQUIRED_SERVER]) {
    const val = process.env[key];
    const ok = Boolean(val && val.trim());
    results.push({ key, ok, group: REQUIRED_CLIENT.includes(key) ? "client" : "server" });
    console.log(`${ok ? "✓" : "✗"} ${key}: ${ok ? mask(val) : "MISSING"}`);
  }

  const clientProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const adminProject = process.env.FIREBASE_PROJECT_ID;
  if (clientProject && adminProject && clientProject !== adminProject) {
    console.log(`\n⚠ PROJECT ID MISMATCH: NEXT_PUBLIC_FIREBASE_PROJECT_ID (${clientProject}) ≠ FIREBASE_PROJECT_ID (${adminProject})`);
    results.push({ key: "project_id_match", ok: false });
  } else if (clientProject && adminProject) {
    console.log(`\n✓ Client and admin Firebase project IDs match: ${clientProject}`);
    results.push({ key: "project_id_match", ok: true });
  }

  const pk = process.env.FIREBASE_PRIVATE_KEY;
  if (pk) {
    const hasRealNewlines = pk.includes("\n");
    const hasEscapedNewlines = pk.includes("\\n");
    if (!hasRealNewlines && !hasEscapedNewlines) {
      console.log("⚠ FIREBASE_PRIVATE_KEY has no newlines — key may be malformed");
      results.push({ key: "private_key_format", ok: false });
    } else {
      console.log(`✓ FIREBASE_PRIVATE_KEY format looks OK (${hasEscapedNewlines ? "escaped \\n" : "literal newlines"})`);
      results.push({ key: "private_key_format", ok: true });
    }
  }

  return results;
}

async function checkFirebaseAdmin() {
  console.log("\n=== 2. Firebase Admin initialization ===\n");
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.log("✗ Skipped — missing Firebase Admin env vars");
    return { ok: false, reason: "missing_env" };
  }
  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");
    const name = "auth-diagnose-admin";
    const existing = getApps().find((a) => a.name === name);
    const app =
      existing ??
      initializeApp(
        {
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          }),
        },
        name
      );
    const auth = getAuth(app);
    // listUsers with limit 1 proves credentials work
    await auth.listUsers(1);
    console.log("✓ Firebase Admin initialized and credentials accepted");
    return { ok: true };
  } catch (err) {
    console.log("✗ Firebase Admin failed:", err.message ?? err);
    return { ok: false, reason: err.message };
  }
}

async function checkSessionRoute() {
  console.log("\n=== 3. Session API (POST /api/auth/session) ===\n");
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "invalid-token-for-diagnostic" }),
    });
    const body = await res.text();
    if (res.status === 401) {
      console.log("✓ Server reachable — invalid token correctly rejected (401)");
      console.log(`  Response: ${body.slice(0, 120)}`);
      return { ok: true, reachable: true };
    }
    if (res.status >= 500) {
      console.log(`✗ Server error ${res.status} — likely Firebase Admin misconfigured`);
      console.log(`  Response: ${body.slice(0, 200)}`);
      return { ok: false, reachable: true, status: res.status };
    }
    console.log(`? Unexpected status ${res.status}: ${body.slice(0, 120)}`);
    return { ok: false, reachable: true, status: res.status };
  } catch (err) {
    if (err.cause?.code === "ECONNREFUSED") {
      console.log(`✗ Server not running at ${BASE_URL} — start with: npm run dev`);
      return { ok: false, reachable: false };
    }
    console.log("✗ Request failed:", err.message);
    return { ok: false, reachable: false };
  }
}

async function checkMiddleware() {
  console.log("\n=== 4. Middleware cookie gate ===\n");
  try {
    const dash = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
    const login = await fetch(`${BASE_URL}/login`, { redirect: "manual" });
    const authApi = await fetch(`${BASE_URL}/api/auth/session`, { method: "DELETE" });

    console.log(`/dashboard without cookie → ${dash.status} ${dash.status === 307 || dash.status === 302 ? "(redirect to login — expected)" : ""}`);
    const loc = dash.headers.get("location");
    if (loc) console.log(`  Location: ${loc}`);

    console.log(`/login → ${login.status} (expected 200)`);
    console.log(`DELETE /api/auth/session → ${authApi.status} (expected 200)`);

    const noCookieRedirectsToLogin =
      (dash.status === 307 || dash.status === 302) && loc?.includes("/login");
    return { ok: noCookieRedirectsToLogin && login.status === 200 };
  } catch (err) {
    console.log("✗ Middleware check failed:", err.message);
    return { ok: false };
  }
}

async function checkCookieWithFakeSession() {
  console.log("\n=== 5. Middleware with fake __session cookie ===\n");
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, {
      redirect: "manual",
      headers: { Cookie: "__session=fake-token-value" },
    });
    console.log(`/dashboard with fake cookie → ${res.status}`);
    if (res.status === 200) {
      console.log("✓ Middleware only checks cookie PRESENCE (not validity) — fake cookie passes gate");
      console.log("  Note: API routes still verify the token via getSession()");
    } else {
      console.log(`? Status ${res.status} — middleware may have changed`);
    }
    return { ok: res.status === 200 };
  } catch (err) {
    console.log("✗ Check failed:", err.message);
    return { ok: false };
  }
}

function summarize(envResults, adminResult, sessionResult, middlewareResult) {
  console.log("\n" + "=".repeat(60));
  console.log("DIAGNOSIS SUMMARY");
  console.log("=".repeat(60) + "\n");

  const missing = envResults.filter((r) => r.key && !r.ok);
  const missingClient = missing.filter((r) => r.group === "client");
  const missingServer = missing.filter((r) => r.group === "server");

  if (missingClient.length > 0) {
    console.log("LIKELY CAUSE: Missing client Firebase env vars");
    console.log("  → Google popup may fail or Firebase client won't initialize.");
    console.log("  → Set all NEXT_PUBLIC_FIREBASE_* vars from Firebase Console → Project settings.\n");
  }

  if (missingServer.length > 0) {
    console.log("LIKELY CAUSE: Missing Firebase Admin / server env vars");
    console.log("  → Google OAuth succeeds on client, but POST /api/auth/session returns 401.");
    console.log("  → No __session cookie is set → middleware redirects back to /login.");
    console.log("  → This is the #1 cause of 'Google login loops back to login'.\n");
  }

  if (!adminResult.ok && adminResult.reason && adminResult.reason !== "missing_env") {
    console.log("LIKELY CAUSE: Invalid Firebase Admin credentials");
    console.log(`  → ${adminResult.reason}`);
    console.log("  → Re-download service account JSON from Firebase Console → Project settings → Service accounts.\n");
  }

  if (sessionResult.reachable && sessionResult.status >= 500) {
    console.log("LIKELY CAUSE: Session route crashes (check server logs for firebase-admin errors).\n");
  }

  if (missing.length === 0 && adminResult.ok) {
    console.log("Env + Admin look OK from this environment.");
    console.log("If login still loops in browser, check:");
    console.log("  1. DevTools → Network → POST /api/auth/session (must be 200 + Set-Cookie)");
    console.log("  2. DevTools → Application → Cookies → __session present after sign-in");
    console.log("  3. Firebase Console → Auth → Sign-in method → Google enabled");
    console.log("  4. Firebase Console → Auth → Settings → Authorized domains includes your host");
    console.log("  5. Production must be HTTPS (secure cookie flag is on when NODE_ENV=production)");
    console.log("  6. Grant service account 'Service Account Token Creator' for 14-day session cookies\n");
  }

  const exitCode = missingServer.length > 0 || !adminResult.ok ? 1 : 0;
  return exitCode;
}

async function main() {
  console.log("Bountixx Auth Diagnostics");
  console.log(`Base URL: ${BASE_URL}\n`);

  loadDotEnv();
  const envResults = checkEnvVars();
  const adminResult = await checkFirebaseAdmin();
  const sessionResult = await checkSessionRoute();
  let middlewareResult = { ok: false };
  let fakeCookieResult = { ok: false };
  if (sessionResult.reachable) {
    middlewareResult = await checkMiddleware();
    fakeCookieResult = await checkCookieWithFakeSession();
  }

  const exitCode = summarize(envResults, adminResult, sessionResult, middlewareResult);
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
