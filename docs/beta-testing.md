# Private beta testing

Lightweight beta layer controlled by a single environment variable. The core app is unchanged when beta mode is off.

## Enable beta (Vercel / `.env.local`)

```env
NEXT_PUBLIC_BETA_MODE=true
```

Optional:

```env
NEXT_PUBLIC_BETA_SURVEY_URL=https://docs.google.com/forms/d/e/…/viewform
```

Feedback and survey submissions email the same inbox as the contact form (`CONTACT_INBOX` or `RESEND_CONTACT_TO`).

## What testers see

| Feature | Location |
|---------|----------|
| **Beta** badge | Sidebar (desktop), mobile header |
| **Give feedback** | Floating button → `/feedback` |
| **Tester survey** | `/tester-survey` (in-app form + optional Google Form) |
| **Create sample event** | Events page (one demo draft event) |
| **Payments disabled** | Settings → Billing, marketing pricing |
| **Private beta** | Marketing home nav + hero |

## Rollback

1. Remove `NEXT_PUBLIC_BETA_MODE` or set it to `false`.
2. Redeploy.

No database migration. Beta API routes return 404 when the flag is off.

## Optional cleanup later

Delete `lib/beta/`, `app/components/beta/`, `app/api/beta/`, and beta-only page routes if you no longer need the code paths.
