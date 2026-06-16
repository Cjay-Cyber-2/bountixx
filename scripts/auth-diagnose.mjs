#!/usr/bin/env node
/**
 * Auth diagnostic script — checks Clerk env, middleware paths, and server health.
 * Run: npm run auth:diagnose
 * With live server: BASE_URL=http://localhost:3000 npm run auth:diagnose
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const REQUIRED_CLERK = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
];

const RECOMMENDED_CLERK = [
  "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL",
  "NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL",
];

const REQUIRED_OTHER = ["DATABASE_URL"];

const LEGACY_FIREBASE_AUTH = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
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
  return `${val.slice(0, 6)}…${val.slice(-4)} (${val.length} chars)`;
}

function checkEnvVars() {
  console.log("\n=== 1. Clerk environment variables (REQUIRED) ===\n");
  let allRequiredOk = true;

  for (const key of REQUIRED_CLERK) {
    const val = process.env[key];
    const ok = Boolean(val && val.trim());
    if (!ok) allRequiredOk = false;
    console.log(`${ok ? "✓" : "✗"} ${key}: ${ok ? mask(val) : "MISSING"}`);
  }

  console.log("\n=== 2. Clerk redirect URLs (strongly recommended) ===\n");
  for (const key of RECOMMENDED_CLERK) {
    const val = process.env[key];
    const ok = Boolean(val && val.trim());
    console.log(`${ok ? "✓" : "⚠"} ${key}: ${ok ? val : "not set — OAuth may redirect to accounts.dev"}`);
  }

  const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL;
  const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL;
  if (signInUrl && signInUrl !== "/login") {
    console.log(`\n⚠ NEXT_PUBLIC_CLERK_SIGN_IN_URL is "${signInUrl}" — app expects /login`);
  }
  if (signUpUrl && signUpUrl !== "/signup") {
    console.log(`⚠ NEXT_PUBLIC_CLERK_SIGN_UP_URL is "${signUpUrl}" — app expects /signup`);
  }

  console.log("\n=== 3. Database ===\n");
  for (const key of REQUIRED_OTHER) {
    const val = process.env[key];
    const ok = Boolean(val && val.trim());
    if (!ok) allRequiredOk = false;
    console.log(`${ok ? "✓" : "✗"} ${key}: ${ok ? mask(val) : "MISSING"}`);
  }

  console.log("\n=== 4. Legacy Firebase auth vars (should be REMOVED) ===\n");
  for (const key of LEGACY_FIREBASE_AUTH) {
    const val = process.env[key];
    if (val) {
      console.log(`⚠ ${key}: still set — auth no longer uses Firebase (only needed for optional push notifications)`);
    } else {
      console.log(`✓ ${key}: not set (good)`);
    }
  }

  return { allRequiredOk };
}

async function checkRoutes() {
  console.log("\n=== 5. Route checks ===\n");
  try {
    const login = await fetch(`${BASE_URL}/login`, { redirect: "manual" });
    console.log(`GET /login → ${login.status}${login.status === 200 ? " (custom UI should load)" : ""}`);

    const signup = await fetch(`${BASE_URL}/signup`, { redirect: "manual" });
    console.log(`GET /signup → ${signup.status}`);

    const dash = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
    const loc = dash.headers.get("location") ?? "";
    console.log(
      `GET /dashboard (no session) → ${dash.status}` +
        (loc ? ` → ${loc}` : "")
    );

    if (loc.includes("accounts.dev")) {
      console.log("  ✗ STILL redirecting to Clerk Account Portal — set NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login in Vercel");
      return { ok: false, accountsDev: true };
    }
    if ((dash.status === 307 || dash.status === 302) && loc.includes("/login")) {
      console.log("  ✓ Redirects to /login on your domain (expected)");
    }

    const sso = await fetch(`${BASE_URL}/sso-callback`, { redirect: "manual" });
    console.log(`GET /sso-callback → ${sso.status} (public OAuth callback)`);

    return { ok: login.status === 200 };
  } catch (err) {
    if (err.cause?.code === "ECONNREFUSED") {
      console.log(`✗ Server not running at ${BASE_URL} — start with: npm run dev`);
      return { ok: false, unreachable: true };
    }
    console.log("✗ Route check failed:", err.message);
    return { ok: false };
  }
}

function summarize(envOk, routeResult) {
  console.log("\n" + "=".repeat(60));
  console.log("DIAGNOSIS SUMMARY");
  console.log("=".repeat(60) + "\n");

  if (!envOk.allRequiredOk) {
    console.log("BLOCKER: Missing Clerk keys or sign-in/sign-up URL env vars.");
    console.log("  → Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,");
    console.log("    NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login, NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup");
    console.log("  → See user_task.md for the full Vercel checklist.\n");
  }

  if (routeResult.accountsDev) {
    console.log("BLOCKER: Middleware still sends users to accounts.dev.");
    console.log("  → Set Clerk path env vars in Vercel and Clerk Dashboard → Paths.\n");
  }

  if (envOk.allRequiredOk && routeResult.ok) {
    console.log("Clerk env + routes look OK from this environment.");
    console.log("Test Google sign-in in the browser to confirm OAuth end-to-end.\n");
  }

  return envOk.allRequiredOk && !routeResult.accountsDev ? 0 : 1;
}

async function main() {
  console.log("Bountixx Clerk Auth Diagnostics");
  console.log(`Base URL: ${BASE_URL}`);
  console.log("Auth provider: Clerk (custom /login and /signup UI)\n");

  loadDotEnv();
  const envOk = checkEnvVars();
  const routeResult = await checkRoutes();
  const exitCode = summarize(envOk, routeResult);
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
