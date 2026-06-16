# Human setup tasks — Bountixx (Clerk auth + everything wired)

This file lists everything **you** must do by hand (it cannot be done from code) to make the app run correctly in production after the Firebase to Clerk migration. Work top to bottom.

---

## 1. Clerk — create the app and get your keys (REQUIRED)

1. Go to <https://dashboard.clerk.com> and create an application (or open your existing one).
2. Copy the API keys from **Configure → API keys**:
   - **Publishable key** — looks like `pk_live_...` (or `pk_test_...` for the dev instance)
   - **Secret key** — looks like `sk_live_...` (or `sk_test_...`)

### Env vars to ADD in Vercel (Project → Settings → Environment Variables)

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | your `pk_...` key | **Required.** Public. |
| `CLERK_SECRET_KEY` | your `sk_...` key | **Required.** Secret. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/login` | Keeps Clerk pointed at our custom UI. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/signup` | Same. |

> Set these for **Production** and **Preview**. For local dev put them in `.env.local`.

---

## 2. Clerk — enable the exact sign-in / sign-up methods (REQUIRED)

Our custom login/signup screens call Clerk for each method, so each one must be turned on in the Clerk Dashboard or that button/tab will error. Go to **Configure → User & authentication**.

1. **Email**
   - Email address: **on**, set as an identifier.
   - Verification: enable **Email verification code** (used by the password sign-up flow).
   - Enable **Email verification link / Email link** (this powers the "Magic Link" tab).
2. **Password**
   - Turn **Password** on (powers the "Password" tab).
3. **Phone**
   - Turn **Phone number** on and enable **SMS verification code** (powers the "Phone" tab).
   - Note: SMS may require a paid Clerk plan and can incur per-message cost.
4. **Social connections (SSO)** → enable:
   - **Google** (powers "Continue with Google")
   - **GitHub** (powers "Continue with GitHub")
   - On the **development** instance Clerk provides shared OAuth credentials automatically.
   - On the **production** instance you MUST add your own OAuth credentials:
     - Google: create an OAuth client in Google Cloud Console, paste Client ID/Secret into Clerk, and add Clerk's callback URL (Clerk shows it) to Google's authorized redirect URIs.
     - GitHub: create an OAuth App in GitHub Developer Settings, paste Client ID/Secret into Clerk, set the callback URL Clerk shows.
5. **Username**: you do **not** need to enable Clerk usernames. The username typed on sign-up is stored in the user's `unsafeMetadata` and copied into our Neon database automatically on first login.

### Paths / redirect URLs
Clerk OAuth and magic links return to **`/sso-callback`** in our app. You don't have to configure this in Clerk (it is passed at runtime), but if Clerk asks for allowed redirect origins, add your production domain (e.g. `https://your-domain.com`).

---

## 3. Clerk — production instance (REQUIRED before go-live)

- The `pk_test_/sk_test_` keys work immediately on any URL (development instance).
- For your real domain you must create/activate the **Production** instance in Clerk and complete its **DNS records** (Clerk gives you CNAMEs to add at your domain registrar). Until DNS is verified, production sign-in will not work.
- Use the **production** `pk_live_/sk_live_` keys in Vercel Production after DNS is verified.

---

## 4. Neon database (REQUIRED)

1. Keep your existing **`DATABASE_URL`** env var (Neon Postgres connection string, the pooled `...-pooler...` URL is fine).
2. Apply the database schema/migrations once (from your machine with `DATABASE_URL` in `.env.local`):
   ```bash
   npm install
   npm run db:migrate      # applies the SQL migrations in /drizzle
   ```
   If `db:migrate` reports nothing to do or you prefer to sync the schema directly, you can use:
   ```bash
   npx drizzle-kit push
   ```
3. That's it — the app creates each user's row automatically on their first login (with the 500-coin welcome bonus). User IDs are now Clerk IDs (`user_...`).

> Note on existing data: rows created under the old Firebase UIDs will not match new Clerk IDs. For a clean cut-over this is fine (new accounts are created on first login). If you need to preserve old accounts, that requires a manual data migration (not covered here).

---

## 5. Your current Vercel env — what to change

You said you have ~11 sensitive vars (mostly Firebase + the database). Here is what to do with each kind:

| Existing variable | Action |
|---|---|
| `DATABASE_URL` | **KEEP** — required (Neon). |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | **OPTIONAL now** — only used for push notifications. Keep if you want push; otherwise safe to delete. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Optional (push only). |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Optional (push only). |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Optional (push only). |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Optional (push only). |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Optional (push only). |
| `FIREBASE_PROJECT_ID` | Optional (push only, server). |
| `FIREBASE_CLIENT_EMAIL` | Optional (push only, server). |
| `FIREBASE_PRIVATE_KEY` | Optional (push only, server). |

**Then ADD the Clerk vars from section 1.** Auth no longer uses Firebase at all — avatars and sessions are handled by Clerk. If you do not care about browser push notifications, you can delete all 9 Firebase vars.

---

## 6. Other env vars the app uses (set the ones you need)

| Variable | Required for | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Payments (Stripe + Paystack redirects) | Set to your full site URL, e.g. `https://your-domain.com`. **No trailing slash.** |
| `GROQ_API_KEY` | AI room analysis (`/create`) | Get from <https://console.groq.com>. Without it, room creation's AI step returns "AI unavailable". |
| `STRIPE_SECRET_KEY` | USD coin purchases | From the Stripe dashboard. |
| `STRIPE_WEBHOOK_SECRET` | Crediting coins after Stripe payment | Create a webhook endpoint in Stripe pointing to `https://your-domain.com/api/payment/stripe/webhook` and paste its signing secret. |
| `PAYSTACK_SECRET_KEY` | NGN coin purchases | From the Paystack dashboard. |
| `ADMIN_EMAIL` | Free room creation for the owner account | Defaults to `chijiokejoseph2022@gmail.com`. Set this to the email of the Clerk account that should be exempt from the room-creation fee. |
| `NEXT_PUBLIC_FCM_VAPID_KEY` | Push notifications (optional) | Only if you keep Firebase push. From Firebase Console → Cloud Messaging → Web Push certificates. |

---

## 7. After deploying — verify (do this once live)

- [ ] Sign up with **email + password** → you receive a 6-digit code → entering it lands you on the dashboard.
- [ ] Sign up / sign in with **Google** → after choosing the account you land on the dashboard (no bounce back to login).
- [ ] Sign in with **GitHub**.
- [ ] **Magic Link** tab → email arrives → clicking the link signs you in.
- [ ] **Phone** tab → SMS code arrives → entering it signs you in.
- [ ] Two different people signing in see **their own** name/initials in the top-right (no stale "CJ").
- [ ] Dashboard and every sub-page (Create, Wallet, Profile, Lobby) render centered and are **not** hidden under the top nav.
- [ ] Sign out returns you to the landing page and clears the session.
- [ ] (If configured) buy a coin bundle with Stripe/Paystack and confirm coins are credited.

---

## 8. Quick reference — final env var list

**Required**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
DATABASE_URL
NEXT_PUBLIC_APP_URL
```
**Recommended / feature-dependent**
```
GROQ_API_KEY            # AI challenge structuring
STRIPE_SECRET_KEY       # card payments (USD)
STRIPE_WEBHOOK_SECRET   # Stripe coin crediting
PAYSTACK_SECRET_KEY     # payments (NGN)
ADMIN_EMAIL             # fee-exempt owner account
```
**Optional (push notifications only — delete if unused)**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
NEXT_PUBLIC_FCM_VAPID_KEY
```
