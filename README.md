# Scanline

AI resume builder, optimizer, ATS checker, and auto-fixer — with accounts,
saved history, and PDF/Word export.

This is a static site (`index.html`) plus two small serverless functions
(`/api/claude.js`, `/api/kv.js`). No framework, no build step.

## 1. Push to GitHub

```bash
cd scanline-app
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/scanline.git
git push -u origin main
```

## 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your
   `scanline` repo.
2. Framework preset: leave as **Other** (no build command needed).
3. Click **Deploy**. It'll go live at `scanline-xyz.vercel.app` — but the
   app won't fully work yet, because it needs two things below first.

## 3. Add Vercel KV (storage for accounts, sessions, saved CVs)

1. In your Vercel project → **Storage** tab → **Create Database** → **KV**.
2. Connect it to this project. Vercel automatically adds the
   `KV_REST_API_URL` / `KV_REST_API_TOKEN` environment variables for you —
   you don't need to copy anything manually.

## 4. Add your Anthropic API key

1. Get a key from [console.anthropic.com](https://console.anthropic.com) →
   **API Keys**.
2. In Vercel → **Settings** → **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your key
   - `ANTHROPIC_MODEL` = `claude-sonnet-5` (check
     [docs.claude.com](https://docs.claude.com) for the current recommended
     model string — this changes over time)
3. Redeploy (Vercel → **Deployments** → **Redeploy**) so the new env vars
   take effect.

## 5. Connect your domain

1. Vercel project → **Settings** → **Domains** → **Add**.
2. Type in your domain (e.g. `scanlineresume.com`).
3. **If you already own the domain**: Vercel will show you either an
   `A` record or a `CNAME` record to add. Go to your domain registrar
   (Namecheap, GoDaddy, Google Domains, etc.), open DNS settings, add the
   record exactly as shown. Propagation usually takes a few minutes to a
   few hours.
4. **If you don't own a domain yet**: you can buy one directly inside the
   same Vercel "Add Domain" screen — no need to leave the dashboard.
5. HTTPS is issued automatically once DNS resolves — nothing else to do.

## Important limits of this version — read before real users sign up

- **Auth is intentionally lightweight.** Passwords are hashed (SHA-256)
  before being stored, and API calls require a login token, but there's no
  password reset, no email verification, and no protection against
  automated signup spam. Fine for testing with real people you trust; for
  a public launch, swap this for a real auth provider (Supabase Auth,
  Clerk, NextAuth) — the account/session logic lives in the second
  `<script>` block near the bottom of `index.html`, easy to unplug.
- **`/api/kv` is unauthenticated.** It's cheap to call (no per-request
  cost the way Claude calls are), but nothing stops someone from writing
  junk data to it. Low risk for a small user base, worth revisiting if you
  scale.
- **`/api/claude` costs you money per call**, gated only by "has a valid
  login token." There's no rate limiting per account — someone with an
  account could hammer it. Worth adding usage caps per user before this
  gets real traffic.
- **The model string in `api/claude.js` may go stale.** Anthropic updates
  model names periodically — check the docs if you start getting model
  errors.

## Local development

```bash
npm install -g vercel
npm install
vercel dev
```

This runs the static site + API routes locally, but you'll still need real
`ANTHROPIC_API_KEY` and KV env vars in a `.env.local` file (copy
`.env.example` and fill in your own values) — `vercel dev` reads Vercel KV
credentials from your linked project, so run `vercel link` first.
