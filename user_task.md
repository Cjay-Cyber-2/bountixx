# Bountixx — Your setup checklist (human tasks)

This app uses **Clerk** for authentication with **your custom** `/login` and `/signup` pages.
If you see Clerk’s hosted page at `special-wolf-28.accounts.dev`, the steps below fix that.

---

## What the code already does (you do NOT need to code this)

- Custom Bountixx login/signup UI at `/login` and `/signup`
- Google, GitHub, email/password, magic link, and phone OTP via Clerk
- OAuth callback at `/sso-callback` (not Clerk’s hosted portal)
- Google OAuth “finish sign up” page at `/signup/continue` (terms / extra fields)
- Protected routes via Clerk middleware (`proxy.ts`)
- User rows synced to Neon Postgres on first sign-in

---

## Step 1 — Fix Vercel environment variables

Open **Vercel → your project → Settings → Environment Variables**.

### ADD these (required for Clerk)

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` | Clerk Dashboard → Configure → API keys |
| `CLERK_SECRET_KEY` | `sk_test_...` or `sk_live_...` | Same page — keep secret |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/login` | **Critical** — stops accounts.dev redirect |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/signup` | **Critical** — stops accounts.dev redirect |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/dashboard` | Where to go after sign-in |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/dashboard` | Where to go after sign-up |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | `/dashboard` | OAuth completion target |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` | `/dashboard` | OAuth completion target |
| `NEXT_PUBLIC_APP_URL` | `https://your-production-domain.com` | Your live site URL |

Apply to **Production** and **Preview**.

### KEEP this (already set)

| Variable | Why |
|----------|-----|
| `DATABASE_URL` | Neon Postgres — required |

### ADD one of these (required for **Analyze with AI**)

The create-arena flow calls `/api/rooms/analyse`. Set **at least one** key in Vercel (Production + Preview), then **redeploy**.

| Variable | Where to get it | Notes |
|----------|-----------------|-------|
| `GROQ_API_KEY` | [Groq Console](https://console.groq.com/keys) | **Preferred** — checked first if set |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | Used when `GROQ_API_KEY` is not set |

If neither is set, **Analyze with AI** shows an error about missing keys (not a generic network failure).

### ADD for CODING arenas (code execution)

Coding challenges run players' code against AI-generated test cases. **You need a code runner for every language except JavaScript** (JavaScript runs locally on the server with zero config).

#### How Bountixx picks a runner

| Priority | Env vars | What runs |
|----------|----------|-----------|
| **1 (default)** | `JDOODLE_CLIENT_ID` + `JDOODLE_CLIENT_SECRET` | **JDoodle** — all supported languages, zero infra |
| 2 | `JUDGE0_URL` (+ optional `JUDGE0_KEY`) | Judge0 — all supported languages |
| 3 | `PISTON_URL` | Piston — all supported languages |
| 4 (fallback) | *(none)* | **JavaScript / TypeScript only** via built-in Node VM |

Higher-priority runners win. **JDoodle is the recommended runner** — no servers to manage and supports every language out of the box.

**Supported languages** (AI-detected, locked in the editor): Python, JavaScript, TypeScript, Java, C++, C, Go, Rust, Ruby, PHP, C#.

Non-coding arenas (trivia / logic / math) work without any of these variables.

---

#### Option DEFAULT — JDoodle (recommended)

JDoodle is a hosted code-execution API that supports every language Bountixx ships, with no infrastructure to maintain.

##### Step J1 — Get JDoodle credentials

1. Sign up at [https://www.jdoodle.com/compiler-api](https://www.jdoodle.com/compiler-api)
2. Go to **My Account → API Credentials**
3. Copy your **Client ID** and **Client Secret**

The free tier includes 200 credits/day (enough for early testing). Paid plans start at 200k credits/month.

##### Step J2 — Add the variables in Vercel

Add these to **Production** and **Preview**, then **Redeploy**:

| Variable | Value |
|----------|-------|
| `JDOODLE_CLIENT_ID` | `your-client-id` |
| `JDOODLE_CLIENT_SECRET` | `your-client-secret` |
| `JDOODLE_URL` *(optional)* | `https://api.jdoodle.com/v1/execute` (default — change only if you proxy JDoodle through your own gateway) |

Both `JDOODLE_CLIENT_ID` and `JDOODLE_CLIENT_SECRET` must be set together — if either is missing, Bountixx falls back to the next configured runner.

##### Step J3 — Smoke-test

Bountixx posts this JSON to `JDOODLE_URL` for each test case:

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "script": "print(input())",
  "stdin": "hello",
  "language": "python3",
  "versionIndex": "5"
}
```

Create a **coding** arena → **Run** in the editor → **Submit**. You should see real stdout in the test panel.

Confirm `/api/health` reports `"codeRunner.active": "jdoodle"`.

##### JDoodle troubleshooting

| Symptom | Fix |
|---------|-----|
| `JDoodle auth failed (HTTP 401)` | Wrong client ID/secret — re-copy from JDoodle dashboard, redeploy |
| `JDoodle auth failed (HTTP 403)` | Daily credit limit hit — upgrade plan or wait 24h |
| `/api/health` shows `"active": "js-only"` | Vars not set in **Production** env, or not redeployed |
| Java/C++ output but no compiled answer | Check player code reads stdin correctly — JDoodle returns combined stdout/stderr |
| Older language version than expected | Bump `versionIndex` in `src/lib/languages.ts` (per-language) |

---

---

#### Option A — Piston (self-hosted alternative)

> **Do not use `https://emkc.org/api/v2/piston/execute` without an authorization token.**  
> As of **15 Feb 2026**, the public Piston API is **whitelist-only**. Bountixx does **not** send a Piston API key, so the public endpoint will fail for production. **Self-host Piston** (open source, MIT) on a VPS, Railway, Fly.io, etc.

##### Step A1 — Run Piston with Docker (on a Linux VPS)

**Host requirements:** Docker installed, **cgroup v2 enabled** (cgroup v1 disabled). Most Ubuntu 22.04+ VPS images work.

```bash
# One-container quick start (API on port 2000)
docker run \
  --privileged \
  -v piston_data:/piston \
  -dit \
  -p 2000:2000 \
  --name piston_api \
  --restart unless-stopped \
  ghcr.io/engineer-man/piston
```

The container starts with **zero language runtimes**. You must install the ones Bountixx uses (Step A2).

Verify the API is up:

```bash
curl -s http://127.0.0.1:2000/api/v2/runtimes
# Should return JSON (may be [] before packages are installed)
```

##### Step A2 — Install every language Bountixx needs

On the **same machine** (or any machine that can reach your Piston API), clone Piston once to get the package manager CLI:

```bash
git clone https://github.com/engineer-man/piston
cd piston/cli && npm install && cd -
```

Install all runtimes Bountixx maps to (run each command; first install downloads compilers — takes several minutes):

```bash
PISTON_HOST="http://127.0.0.1:2000"   # change to https://your-piston-domain.com when remote

node cli/index.js -u "$PISTON_HOST" ppman install python
node cli/index.js -u "$PISTON_HOST" ppman install javascript
node cli/index.js -u "$PISTON_HOST" ppman install typescript
node cli/index.js -u "$PISTON_HOST" ppman install java
node cli/index.js -u "$PISTON_HOST" ppman install c++
node cli/index.js -u "$PISTON_HOST" ppman install c
node cli/index.js -u "$PISTON_HOST" ppman install go
node cli/index.js -u "$PISTON_HOST" ppman install rust
node cli/index.js -u "$PISTON_HOST" ppman install ruby
node cli/index.js -u "$PISTON_HOST" ppman install php
node cli/index.js -u "$PISTON_HOST" ppman install csharp
```

Confirm they are installed:

```bash
curl -s "$PISTON_HOST/api/v2/runtimes" | grep -E '"language"|python|javascript|java'
```

You should see `python`, `javascript`, `typescript`, `java`, `c++`, `c`, `go`, `rust`, `ruby`, `php`, `csharp` in the list.

##### Step A3 — Expose Piston over HTTPS (required for Vercel)

Vercel serverless functions call your Piston API over the public internet. Port 2000 must be reachable via **HTTPS** (use Caddy, Nginx, or a platform load balancer).

Example with Caddy on the VPS (after pointing `piston.yourdomain.com` DNS to the server):

```
piston.yourdomain.com {
  reverse_proxy localhost:2000
}
```

##### Step A4 — Set `PISTON_URL` in Vercel

Add to **Production** and **Preview**, then **Redeploy**:

| Variable | Value |
|----------|-------|
| `PISTON_URL` | `https://piston.yourdomain.com/api/v2/execute` |

**Critical URL difference:**

| Deployment | Correct execute URL |
|------------|---------------------|
| **Self-hosted** (you run Docker) | `https://YOUR-HOST/api/v2/execute` |
| Public emkc.org (token required — not supported by Bountixx out of the box) | `https://emkc.org/api/v2/piston/execute` |

Bountixx posts this JSON to `PISTON_URL` for each test case:

```json
{
  "language": "python",
  "version": "*",
  "files": [{ "name": "main.py", "content": "<player code>" }],
  "stdin": "<test input>",
  "run_timeout": 5000,
  "compile_timeout": 10000
}
```

The `language` field must match Piston’s runtime name (`c++` not `cpp`, `csharp` not `cs` — Bountixx maps these automatically).

##### Step A5 — Smoke-test before going live

Replace the URL with your real `PISTON_URL`:

```bash
curl -s -X POST "https://piston.yourdomain.com/api/v2/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "version": "*",
    "files": [{ "name": "main.py", "content": "import sys\nprint(sys.stdin.read().strip())" }],
    "stdin": "hello",
    "run_timeout": 5000,
    "compile_timeout": 10000
  }'
```

Expected: HTTP 200, `"run": { "stdout": "hello", "code": 0 }`.

Then in Bountixx: create a **coding** arena → **Run** in the editor → **Submit**. You should see real stdout, not “execution error” or “not configured”.

##### Piston troubleshooting

| Symptom | Fix |
|---------|-----|
| `400` — `runtime is unknown` | Language not installed — rerun `ppman install <language>` (Step A2) |
| `Connection refused` / timeout from Vercel | Piston not public HTTPS; open firewall port 443; check reverse proxy |
| Works locally, fails on Vercel | `PISTON_URL` missing in **Production** env or you forgot to redeploy |
| `Judge0` runs instead of Piston | Remove `JUDGE0_URL` if you only want Piston |
| Only JS works | `PISTON_URL` unset — JS uses built-in VM; Python/etc. need Piston |
| emkc.org returns 401/403 | Public API needs a token Bountixx does not send — self-host instead |

---

#### Option B — Judge0 (alternative to Piston)

Pick **one** provider. If you use Judge0, leave `PISTON_URL` unset.

| Setup | Variables | Notes |
|-------|-----------|-------|
| **Judge0 via RapidAPI** (easiest hosted) | `JUDGE0_URL=https://judge0-ce.p.rapidapi.com` + `JUDGE0_KEY=<RapidAPI key>` | Subscribe to [Judge0 CE on RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce) (free tier available). |
| **Self-hosted Judge0** | `JUDGE0_URL=https://your-judge0` + `JUDGE0_KEY=<X-Auth-Token or empty>` | [Judge0 CE Docker docs](https://github.com/judge0/judge0). |

---

#### Option C — JavaScript only (no setup)

Leave `PISTON_URL` and `JUDGE0_URL` unset. Players can run/submit **JavaScript** arenas only. All other coding languages show “execution not configured”.

### Database migration (run once)

The schema gained `language` and `starter_code` columns on `rooms` (used to match the task room to the challenge). Apply migrations from your machine with `DATABASE_URL` set:

```bash
npm run db:migrate    # or: npx drizzle-kit push
```

The migration uses `ADD COLUMN IF NOT EXISTS`, so it is safe on an existing database.

Use Neon’s **pooled** connection string in `DATABASE_URL` (host contains `-pooler`) for Vercel serverless. It must include `?sslmode=require`.

After deploy, open `https://YOUR-DOMAIN.com/api/health` — every check should be green before testing Analyze with AI.

### REMOVE or leave unset (auth no longer uses Firebase)

These were for the old Firebase auth system. **Clerk replaced them for login.**

| Variable | Action |
|----------|--------|
| `FIREBASE_PROJECT_ID` | **Remove** from Vercel (unless you want push notifications) |
| `FIREBASE_CLIENT_EMAIL` | **Remove** (unless push notifications) |
| `FIREBASE_PRIVATE_KEY` | **Remove** (unless push notifications) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | **Remove** (unless push notifications) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | **Remove** (unless push notifications) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | **Remove** (unless push notifications) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | **Remove** (unless push notifications) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | **Remove** (unless push notifications) |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | **Remove** (unless push notifications) |

> **Note:** Firebase is still in the codebase only for **optional browser push notifications**. If you are not using push alerts, delete all Firebase variables. Auth will work fine without them.

---

## Step 2 — Configure Clerk Dashboard

Go to [https://dashboard.clerk.com](https://dashboard.clerk.com) → your app (**special-wolf-28**).

### A. Paths (most important)

**Configure → Paths**

| Setting | Value |
|---------|-------|
| Sign-in URL | `/login` |
| Sign-up URL | `/signup` |
| After sign-in URL | `/dashboard` |
| After sign-up URL | `/dashboard` |

Use the **relative paths** above if Clerk offers that option. If it requires full URLs, use:
- `https://YOUR-DOMAIN.com/login`
- `https://YOUR-DOMAIN.com/signup`
- `https://YOUR-DOMAIN.com/dashboard`

### B. Domains

**Configure → Domains**

Add your production domain (e.g. `bountixx.vercel.app` or your custom domain).

### C. Social sign-in providers

**User & Authentication → Social connections**

- Enable **Google**
- Enable **GitHub** (if you want it)
- For Google: add your OAuth client ID/secret from Google Cloud Console, **or** use Clerk’s shared credentials for development

### D. Email / phone / username

**User & Authentication → Email, Phone, Username**

Enable what your UI supports:
- Email address ✓
- Password ✓
- Phone number ✓ (if using phone OTP tab)
- Username (optional — we store display username in app DB)

### E. Account Portal (why you saw accounts.dev)

**Account Portal** is Clerk’s hosted UI. Your app uses **custom pages** instead.

You do **not** need to disable Account Portal, but you must complete Step 1 (env vars) and Step 2A (paths). Without those, Clerk falls back to `https://special-wolf-28.accounts.dev/sign-up`.

### F. Google sign-up — legal terms & extra fields

If Google sign-in stuck on “Completing sign-in…” then bounced to `/signup#/continue`:

1. **Configure → Redirect URLs** — add:
   - `https://bountixx.vercel.app/sso-callback`
   - `https://bountixx.vercel.app/signup/continue`
2. **User & Authentication → Legal** — if “Require at sign-up” is enabled, users will see `/signup/continue` to accept terms (your UI, not Clerk’s card).
3. **User & Authentication → Username** — set to **Optional** if you can (Bountixx stores usernames in its own database).

Ensure `NEXT_PUBLIC_APP_URL=https://bountixx.vercel.app` is set in Vercel (required for OAuth redirect URLs in production).

---

## Step 3 — Redeploy

After changing env vars:

1. Vercel → **Deployments** → open latest deployment → **⋯** → **Redeploy**
2. Or push any commit to trigger a new build

Env vars only apply after a redeploy.

---

## Step 4 — Test (5 minutes)

### A. Local (optional)

```bash
cp .env.example .env.local
# Fill in Clerk keys + DATABASE_URL
npm install
npm run dev
npm run auth:diagnose
```

Open `http://localhost:3000/login` — you should see **your** Bountixx UI, not Clerk’s card.

### B. Production smoke test

1. Open `https://YOUR-DOMAIN.com/login` — Bountixx “SIGN IN” page (dark theme, “CONTINUE WITH GOOGLE”)
2. Click **Continue with Google**
3. Complete Google OAuth
4. You should land on `/sso-callback` briefly, then `/dashboard`
5. You should **never** see `accounts.dev` or Clerk’s “Create your account / First name / Last name” form

### C. If something fails

| Symptom | Fix |
|---------|-----|
| Redirect to `accounts.dev` | Add `NEXT_PUBLIC_CLERK_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL` in Vercel, redeploy |
| Blank login page / Clerk error | Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set |
| 500 on API routes | Check `CLERK_SECRET_KEY` and `DATABASE_URL` |
| Google button does nothing | Enable Google in Clerk Dashboard → Social connections |
| Lands on login after Google | Check Clerk paths + `NEXT_PUBLIC_CLERK_*_REDIRECT_URL` vars |
| Stuck on “Completing sign-in…” then `/signup#/continue` | Redeploy latest `main`; add redirect URLs in Clerk Dashboard; complete `/signup/continue` (terms checkbox if required) |
| **Analyze with AI** fails / “could not reach service” | Add `GROQ_API_KEY` or `GEMINI_API_KEY` in Vercel → redeploy. Open `/api/health` to see which env check failed |
| **Analyze with AI** — “Clerk server auth failed” | `CLERK_SECRET_KEY` missing or mismatched with your publishable key — add in Vercel Production + Preview, redeploy |
| **Analyze with AI** — Groq/Gemini error in UI | API key invalid or rate-limited — the UI now shows the provider message |
| **Coding Run/Submit** — “execution not configured” | Set `JDOODLE_CLIENT_ID` + `JDOODLE_CLIENT_SECRET` (default) — or `JUDGE0_URL` / `PISTON_URL`. See **ADD for CODING arenas** above. JS works without config. |
| **Coding Run/Submit** — “runtime is unknown” / execution error | Piston language not installed — run `ppman install python` (etc.) on your Piston server |
| **Invite link / QR not working** | Set `NEXT_PUBLIC_APP_URL=https://bountixx.vercel.app` in Vercel so links always use your production domain, then redeploy |

### D. Browser DevTools check

After Google sign-in:
- **Network** → no permanent redirect to `accounts.dev`
- **Application → Cookies** → Clerk session cookies present (`__session` or `__clerk_*`)
- **Console** → no Clerk “missing publishable key” errors

---

## Step 5 — Clerk vs Firebase summary

| Feature | Provider |
|---------|----------|
| Sign in / sign up | **Clerk** |
| Session / middleware | **Clerk** |
| User profile images | **Clerk** |
| Database user rows | **Neon** (synced via `getSession()`) |
| Push notifications | **Firebase FCM** (optional only) |

---

## Quick copy-paste for Vercel

Add these with your real values:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_APP_URL=https://YOUR-DOMAIN.com
GROQ_API_KEY=your-groq-api-key

# Coding execution — pick ONE (see "ADD for CODING arenas" section)
# JDoodle (default — hosted, all languages, zero infra):
JDOODLE_CLIENT_ID=your-jdoodle-client-id
JDOODLE_CLIENT_SECRET=your-jdoodle-client-secret

# OR self-hosted Piston:
# PISTON_URL=https://piston.yourdomain.com/api/v2/execute

# OR Judge0 via RapidAPI:
# JUDGE0_URL=https://judge0-ce.p.rapidapi.com
# JUDGE0_KEY=your-rapidapi-key
```

Then **remove** the Firebase auth variables listed in Step 1 unless you need push notifications.

---

## Done?

When all tests pass:
- [ ] `/login` shows Bountixx UI
- [ ] Google sign-in reaches `/dashboard`
- [ ] No `accounts.dev` redirects
- [ ] Sign out works and returns to `/`
- [ ] Coding arena **Run** + **Submit** work for Python (or your target language) when `PISTON_URL` is set

If you are still stuck, run `npm run auth:diagnose` locally and share the output.
