# PromoSync Security

Operational security notes for the PromoSync promoter app.

## Environment variables (production)

| Variable | Purpose |
|----------|---------|
| `UPSTASH_REDIS_REST_URL` | Distributed rate limiting for auth and contact endpoints |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST API token |
| `NEXT_PUBLIC_APP_URL` | Allowed Origin for CSRF checks (e.g. `https://www.promosync.app`) |

Without Upstash in production, sign-in rate limiting fails closed (503) when Redis is unavailable.

## Content Security Policy

CSP is deployed in **Report-Only** mode via [`lib/security/headers.ts`](lib/security/headers.ts). Violations are logged at `/api/csp-report`.

After one deploy cycle with no violations, switch `Content-Security-Policy-Report-Only` to enforcing `Content-Security-Policy` in the same file.

## Supabase RLS audit checklist

Run this checklist against **production** Supabase with two test accounts (User A and User B in separate workspaces).

### 1. RLS enabled

Confirm Row Level Security is ON for:

- [ ] `public.tasks`
- [ ] `public.notifications`
- [ ] `public.activity_log`
- [ ] `public.events`
- [ ] `public.artists`
- [ ] `public.workspace_members`
- [ ] `public.workspace_billing`
- [ ] `public.workspaces`
- [ ] `public.comments`
- [ ] `public.task_attachments`

SQL: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN (...);`

### 2. No permissive policies

Search for policies that allow all rows without `auth.uid()` or workspace membership checks:

```sql
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public';
```

Reject any sensitive table with `USING (true)` or missing workspace/user scope.

### 3. Cross-tenant isolation test

As **User A** (JWT from browser devtools → Application → localStorage):

```http
GET {SUPABASE_URL}/rest/v1/tasks?select=*
Authorization: Bearer {USER_A_JWT}
apikey: {ANON_KEY}
```

Repeat as **User B**. User A must **not** see User B's workspace tasks, events, or notifications.

### 4. RPC `move_task`

Verify the function:

- Uses `SECURITY DEFINER` only if necessary
- Validates `auth.uid()` and workspace membership before moving tasks
- Is not callable by `anon` role without authentication

### 5. Artist policies

Both policy sets may exist in production:

- `artist-management.sql` — `owner_id = auth.uid()`
- `collaboration.sql` — workspace-scoped artist access

Confirm policies are not conflicting (e.g. one granting broad SELECT while another restricts).

### 6. Storage buckets

- Artist media: users can only upload/update/delete their own paths
- No public write on sensitive buckets

## Pen-test re-test checklist

After deploying to staging/production:

1. **Headers:** `curl -I https://www.promosync.app` → `Content-Security-Policy-Report-Only`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
2. **Clickjacking:** App cannot be embedded in external iframe
3. **Sign-in rate limit:** 6th failed login within 15 min → HTTP 429 with `Retry-After`
4. **Error sanitization:** `POST /api/auth/signin` with `{"email":{}}` → generic error, no JS stack text
5. **Password policy:** Signup with `password` rejected; `Password1!` accepted
6. **Origin check:** `POST /api/auth/signin` with `Origin: https://evil.com` → HTTP 403
7. **Middleware:** Visit `/dashboard` logged out → redirect to `/login` (no authenticated shell)
8. **RLS:** Two-user cross-access test (see section 3 above)
9. **Regression:** OAuth callback, Stripe webhook, Supabase REST still work under CSP report-only

## Auth architecture notes

- JWT is stored in **localStorage** for Supabase REST calls
- `ps-auth` HttpOnly cookie is a **session indicator only** (not the JWT) for middleware gating
- Client-side `DashboardShell` remains as defense-in-depth for token validation
