# Deploy PromoSync on Vercel

This app is a Next.js project in `promoter-app/`. Deploy it from the Vercel dashboard or CLI.

## 1. Push to GitHub

Vercel deploys from Git. Push this repo to GitHub (or GitLab/Bitbucket).

If the repo root is `PromoSync` (not `promoter-app`), set **Root Directory** to `promoter-app` in Vercel project settings.

## 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. **Framework Preset:** Next.js (auto-detected)
4. **Root Directory:** `promoter-app` (if the repo contains the whole monorepo)
5. **Build Command:** `npm run build` (default)
6. **Output Directory:** `.next` (default)

## 3. Environment variables

In **Project → Settings → Environment Variables**, add:

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | From Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `RESEND_API_KEY` | Yes (for team invites) | From [Resend → API Keys](https://resend.com/api-keys) (`re_…`) — **not** in git; set only in Vercel |
| `RESEND_FROM` | Yes (for team invites) | e.g. `PromoSync <invites@promosync.app>` (must use your verified domain) |
| `RESEND_FROM_FEEDBACK` | Recommended (for feedback/surveys) | e.g. `PromoSync <feedback@promosync.app>` (falls back to this default if unset) |
| `NEXT_PUBLIC_APP_URL` | Recommended | Production URL, e.g. `https://www.promosync.app` — used in invite email links |
| `NEXT_PUBLIC_DEMO_AUTH` | Optional | Set to `true` only if you want demo login in production |

Copy values from your local `.env.local` (do not commit `.env.local`).  
**Vercel does not read `.env.local` on deploy** — every row above must be added in the Vercel dashboard (or `vercel env add`).

Apply variables to **Production**, **Preview**, and **Development** as needed, then **Redeploy** (env changes do not apply to past deployments until you redeploy).

Apply variables to **Production**, **Preview**, and **Development** as needed.

## 4. Supabase auth (sign-up / sign-in)

In **Authentication → Providers → Email**:

- Enable **Email** provider
- Turn **Confirm email** on or off (if on, users must click the email link before sign-in)

In **Authentication → URL Configuration**:

- **Site URL:** `https://www.promosync.app`
- **Redirect URLs:** `https://www.promosync.app/auth/callback` and `https://*.vercel.app/auth/callback`

If sign-up shows a generic error, open the browser **Network** tab, retry sign-up, and check the `signup` request response. Common fixes:

- Use the **legacy anon** JWT key (`eyJ...`) in `NEXT_PUBLIC_SUPABASE_ANON_KEY` if the publishable key fails
- Ensure password and confirm password match exactly
- Delete duplicate test users in **Authentication → Users** before re-testing the same email

## 5. Supabase auth redirect URLs

In **Supabase → Authentication → URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** add  
  `https://your-app.vercel.app/auth/callback`  
  and preview URLs if you use branch deploys, e.g.  
  `https://*.vercel.app/auth/callback`

For GitHub OAuth (if used), use the same callback path.

## 5. Deploy

Click **Deploy**. Vercel runs `npm install` and `npm run build` automatically.

Verify locally first:

```bash
cd promoter-app
npm run build
```

## 6. CLI deploy (optional)

```bash
npm i -g vercel
cd promoter-app
vercel login
vercel
```

Follow prompts. Link to an existing project or create a new one. Add env vars in the dashboard or with:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM
vercel env add RESEND_FROM_FEEDBACK
vercel env add NEXT_PUBLIC_APP_URL
```

Production deploy:

```bash
vercel --prod
```

## 7. Collaboration schema (team workspace)

Run SQL migrations in the Supabase SQL editor (in order):

1. `promoter-app/supabase/artist-management.sql`
2. `promoter-app/supabase/collaboration.sql`

3. If Team is empty or you see read-only role errors, also run `promoter-app/supabase/collaboration-rls-bootstrap.sql` (fixes first-admin RLS and backfills your membership).

4. For team invite emails, run `promoter-app/supabase/workspace-invite-accept-rls.sql`.

5. For invitees joining on sign-in, run `promoter-app/supabase/accept-workspace-invite-rpc.sql`.

Enable **Realtime** for `activity_log`, `comments`, and `tasks` if you want live updates on event workspace pages.

## 8. Sprint 2 (billing, import, integrations, MFA, AI)

Run additional SQL in Supabase (after collaboration):

1. `promoter-app/supabase/sprint2-artist-fees.sql`
2. `promoter-app/supabase/sprint2-billing.sql` (uses `admin` role, not `owner`)
3. `promoter-app/supabase/sprint2-integrations.sql`

If billing SQL failed with `invalid input value for enum workspace_role: "owner"`, run `promoter-app/supabase/sprint2-billing-fix-rls.sql` (or re-run the updated `sprint2-billing.sql`).

### Vercel environment variables

| Variable | Feature |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Stripe webhooks, integration token storage, AI file download |
| `STRIPE_SECRET_KEY` | Billing checkout & portal |
| `STRIPE_WEBHOOK_SECRET` | `POST /api/billing/webhook` |
| `STRIPE_PRICE_PROFESSIONAL` | Stripe Price ID for **Pro ($49/mo)** |
| `STRIPE_PRICE_ENTERPRISE` | Stripe Price ID for **Enterprise ($99/mo)** |
| `STRIPE_SWAP_PLAN_PRICES` | Set to `true` if Pro checkout shows $99 and Enterprise shows $50 (reversed env vars) |
| `GOOGLE_INTEGRATION_CLIENT_ID` / `GOOGLE_INTEGRATION_CLIENT_SECRET` | Google Calendar connect |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Spotify connect |
| `STRIPE_CONNECT_CLIENT_ID` | Stripe revenue sync (Connect OAuth) |
| `OPENAI_API_KEY` | Venue document AI extraction (.pdf, .txt, .csv, .json) |
| `AI_EXTRACTION_MODEL` | Optional (default `gpt-4o-mini`) |

### Stripe webhook

In Stripe Dashboard → Developers → Webhooks, add endpoint:

`https://YOUR_DOMAIN/api/billing/webhook`

Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.

### Supabase MFA

Enable **TOTP MFA** in Supabase Dashboard → Authentication → Providers → MFA, then use Settings → Security in the app.

### OAuth redirect URLs (integrations)

Add authorized redirect URI for each provider:

`https://YOUR_DOMAIN/api/integrations/google/callback`  
`https://YOUR_DOMAIN/api/integrations/spotify/callback`  
`https://YOUR_DOMAIN/api/integrations/stripe/callback`

## Notes

- **Demo login** is disabled in production unless `NEXT_PUBLIC_DEMO_AUTH=true`.
- **Events, tasks, team, and activity** sync via Supabase when configured; local fallback is used for demo/offline.
- On first login, events previously stored in `localStorage` are imported into your workspace automatically.
- Artists and venues require Supabase to be configured.
