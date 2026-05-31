# Mobile testing guide

## Local dev on a real phone

1. Start the dev server on your LAN:

   ```bash
   npm run dev:mobile
   ```

2. Find your PC IP (`ipconfig` on Windows, look for IPv4 on Wi‑Fi).

3. On your phone (same Wi‑Fi), open `http://<your-ip>:3000`.

4. Sign in and walk through the checklist below.

## Chrome DevTools

- Toggle device toolbar (Ctrl+Shift+M).
- Presets: iPhone 14, Pixel 7, iPad Mini.
- Test widths: 320, 390, 768, 1024.

## Automated smoke tests (Playwright)

Run mobile viewport checks locally:

```bash
npx playwright install chromium
npm run test:e2e:mobile
```

Tests assert:

- Public routes load without horizontal overflow (390×844 iPhone 14 profile)
- Login email field meets 44px touch height
- App routes redirect cleanly when unauthenticated

Full suite (mobile + tablet):

```bash
npm run test:e2e
```

Set `PLAYWRIGHT_BASE_URL` to test a deployed build instead of local dev.

## Manual checklist

| Route | Must work on phone |
|-------|-------------------|
| `/login` | Form usable, no horizontal overflow |
| `/dashboard` | Bottom tabs + FAB; stats + cards readable |
| `/events` | Status cards stack; card list; search full-width |
| `/run` | KPIs + timeline; filters stack |
| `/events/[id]/workspace?tab=sales` | Modals, KPIs, charts |
| `/tasks` | List view default; task drawer usable |
| `/event-wizard/*` | Compact stepper; sticky Continue/Back bar |
| `/artists`, `/venues` | Browse + detail overlay; 44px inputs |
| `/team`, `/settings` | Tabs stack; inputs consistent height |
| `/venues/new`, `/artists/new` | Step strip scrolls; actions reachable |
| `/`, `/features`, `/pricing` | No horizontal bleed; nav works |

## Production

After deploy, test `https://www.promosync.app` on iOS Safari and Android Chrome.

## Add to Home Screen (PWA)

PromoSync ships a web app manifest and install icons so promoters can pin the app like a native shortcut.

### iOS (Safari)

1. Open the site (signed in at `/dashboard` works best).
2. Tap **Share** → **Add to Home Screen**.
3. Confirm name **PromoSync** and add.

The icon uses the PromoSync mark on the dark app background. The shell runs **standalone** (no Safari chrome).

### Android (Chrome)

1. Open the site over HTTPS.
2. Menu → **Install app** or **Add to Home screen** (wording varies by version).
3. Or accept the install banner when Chrome offers it.

### What this is (and is not)

- **Mobile-native web (Phase 2)** — bottom tab bar (Home, Events, Run, Tasks, More), large screen titles, floating **+** for new events, and card-first lists on phone.
- **Responsive adaptation (Phase 1)** — same routes and data; layouts reflow below `md`.
- **Not a native App Store app** — install is a home-screen shortcut to the web app (PWA manifest included).
- **Not a new design system** — same PromoSync colors and components; mobile uses app-style chrome (tabs, sheets, FAB).

Manifest: `app/manifest.ts` · Icons: `/icons/192`, `/icons/512`, `apple-icon`.
