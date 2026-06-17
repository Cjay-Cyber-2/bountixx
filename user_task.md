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
CLERK_SECRET_KEY=sk_test_xxxxxxxx
```

Then **remove** the Firebase auth variables listed in Step 1 unless you need push notifications.

---

## Done?

When all tests pass:
- [ ] `/login` shows Bountixx UI
- [ ] Google sign-in reaches `/dashboard`
- [ ] No `accounts.dev` redirects
- [ ] Sign out works and returns to `/`

If you are still stuck, run `npm run auth:diagnose` locally and share the output.
