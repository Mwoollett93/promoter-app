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
| `NEXT_PUBLIC_APP_URL` | Recommended | Production URL, e.g. `https://your-app.vercel.app` |
| `NEXT_PUBLIC_DEMO_AUTH` | Optional | Set to `true` only if you want demo login in production |

Copy values from your local `.env.local` (do not commit `.env.local`).

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

Enable **Realtime** for `activity_log`, `comments`, and `tasks` if you want live updates on event workspace pages.

Optional email notifications: set `RESEND_API_KEY` and `RESEND_FROM` for `/api/notifications/email`.

## Notes

- **Demo login** is disabled in production unless `NEXT_PUBLIC_DEMO_AUTH=true`.
- **Events, tasks, team, and activity** sync via Supabase when configured; local fallback is used for demo/offline.
- On first login, events previously stored in `localStorage` are imported into your workspace automatically.
- Artists and venues require Supabase to be configured.
