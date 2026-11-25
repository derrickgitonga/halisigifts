# Halisi Gifts

Online store for **Halisi Gifts** (Nairobi): original watches, Arabian perfumes and gift sets, with M-Pesa / WhatsApp ordering, order tracking and an admin dashboard.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS · PostgreSQL + Prisma 6 · Auth.js (NextAuth v5) · Zod · Resend (email) · Vitest + Playwright

> **Note for contributors:** this Next.js version has breaking changes from older releases. Read [AGENTS.md](AGENTS.md) and the docs in `node_modules/next/dist/docs/` before changing framework-level code (e.g. `middleware.ts` is now `proxy.ts`).

---

## Features

**Storefront**
- Video hero and a filterable shop catalogue (search, category, brand, price, availability, sort) with shareable URLs
- Product pages with variants, low-stock badges, out-of-stock notices, mobile sticky buy bar
- Cart, checkout (M-Pesa till, pay on delivery, rider / pickup / county delivery), WhatsApp ordering
- Wishlist and recently viewed (stored in the browser, no account needed)
- **Order tracking** at `/track-order`: customer enters the order number (e.g. `HG-10001`) plus their phone or email
- SEO: sitemap, robots, JSON-LD product schema, Meta & TikTok product feeds and pixels

**Orders & email**
- Human-friendly order numbers starting at `HG-10001`
- Emails via Resend: order confirmation to the customer, new-order alert to the shop, and status updates (confirmed / shipped / ready for pickup / delivered / cancelled) when the admin changes an order's status
- Abandoned-cart recovery job (`/api/cron/abandoned-carts`)

**Admin** (`/admin`)
- Products, variants, categories, image uploads, orders (search by HG number, M-Pesa code, email…)
- Login rate-limited; sessions expire after 12 hours; password reset by email

**Resilience**
- If the database is unreachable, the storefront falls back to `data/catalog_dump.json` so customers can still browse (checkout and tracking return a "temporarily unavailable" message)

---

## Local development

### 1. Prerequisites
- **Node.js 22** (20+ works)
- **PostgreSQL 16**, any of:
  - Docker: `docker compose up -d postgres`
  - A normal PostgreSQL install, or the [portable Windows binaries](https://www.enterprisedb.com/download-postgresql-binaries) (no admin rights needed)
  - A hosted database (Neon, Supabase…)

### 2. Install and configure
```bash
npm install
cp .env.example .env
```
Edit `.env`. At minimum set `DATABASE_URL`, `POSTGRES_PASSWORD`, `AUTH_SECRET`, `ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. Generate secrets with:
```bash
openssl rand -hex 32
```
Never commit `.env`; it is git-ignored.

### 3. Create the database tables
```bash
npx prisma migrate deploy
```
If you're running PostgreSQL yourself (not Docker), create the empty database first, e.g. `CREATE DATABASE halisi_db;`.

### 4. Load the products and admin account
```bash
# The live catalogue: 12 categories, 216 products
npx tsx scripts/import_catalog_json.ts

# Admin + test customer accounts from ADMIN_EMAIL / SEED_ADMIN_PASSWORD etc.
npx tsx --env-file=.env scripts/seed_users.ts
```
> **Don't run `npm run db:seed` on a database that already has the catalogue.** It deletes the catalogue products (SKUs starting `MWB-`) and rebuilds an older 186-product set from `temp_docx/`.

### 5. Run
```bash
npm run dev            # http://localhost:3000
npm run dev -- -p 3001 # or another port
```
Admin: http://localhost:3000/admin/login (use `ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

---

## Environment variables

See [.env.example](.env.example) for the full list with comments.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | For Docker | Used by `docker-compose.yml` (refuses to start without a password) |
| `AUTH_SECRET` | Yes | Session signing key, 32+ random characters. Production refuses to start with a missing, short or example value |
| `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL` | Yes | Site address (`http://localhost:3000` locally, the real domain in production) |
| `ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | For seeding | Admin account created by the seed |
| `CUSTOMER_EMAIL`, `SEED_CUSTOMER_PASSWORD` | Optional | Test customer account |
| `RESEND_API_KEY`, `FROM_EMAIL` | For email | Without them, emails are skipped (logged only) |
| `ORDER_ALERT_EMAIL` | Optional | Where new-order alerts go (falls back to `ADMIN_EMAIL`) |
| `CRON_SECRET` | For the cron job | Bearer token for `/api/cron/abandoned-carts` |
| `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_TEST_EVENT_CODE` | Optional | Meta pixel and Conversions API |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID`, `TIKTOK_EVENTS_API_ACCESS_TOKEN`, `TIKTOK_TEST_EVENT_CODE` | Optional | TikTok pixel and Events API |
| `PUBLIC_ASSETS_DIR`, `PRODUCT_UPLOAD_DIR` | Optional | Where admin image uploads are saved (default `public/products`) |

---

## Database changes

Edit `prisma/schema.prisma`, then:
```bash
npm run db:migrate -- --name describe_the_change   # creates a migration in prisma/migrations
```
Commit the new migration folder. Production applies migrations with `npx prisma migrate deploy`. Avoid `npm run db:push` on shared databases: it changes the schema without recording a migration.

---

## Tests and checks

```bash
npm run test        # unit tests (Vitest)
npm run test:e2e    # end-to-end tests (Playwright; needs the app running)
npx tsc --noEmit    # type check
npm run build       # production build
```

---

## Project layout

```
app/                 Pages and API routes (App Router)
  api/               checkout, cart, orders/track, admin/*, cron, feeds
  admin/             Admin dashboard
  track-order/       Order tracking page
components/          UI (home, product, cart, checkout, layout, seo)
lib/                 Prisma client + DB guard, catalogue, emails, order numbers, auth helpers
prisma/              schema.prisma, migrations, seed
data/catalog_dump.json  Catalogue snapshot (offline fallback + import source)
public/              Static files; product images in public/products, hero video in public/videos
scripts/             One-off catalogue import / maintenance scripts
tests/               unit/ and e2e/
```

---

## Docker

```bash
docker compose up -d           # database + app (http://localhost:3000)
docker compose up -d postgres  # database only, bound to 127.0.0.1:5432
```
`AUTH_SECRET` and `POSTGRES_PASSWORD` must be set in `.env` or Compose will refuse to start.

---

## Production deployment (two servers)

For high availability, strict security, and clean separation of concerns, deploy using a two-VPS topology on DigitalOcean, AWS EC2, or Hetzner:

```
                  ┌───────────────────────────────┐
                  │          USER BROWSER         │
                  └──────────────┬────────────────┘
                                 │ HTTPS (Port 443)
                                 ▼
         ┌────────────────────────────────────────────────┐
         │             VPS 1: APP SERVER                  │
         │  ┌──────────────────────────────────────────┐  │
         │  │           Caddy Reverse Proxy            │  │
         │  │         (Automatic TLS / Let's Encrypt)  │  │
         │  └────────────────────┬─────────────────────┘  │
         │                       │ localhost:3000         │
         │  ┌────────────────────▼─────────────────────┐  │
         │  │         Next.js Node.js Service          │  │
         │  │      (Private IP: 10.0.0.10)            │  │
         │  └────────────────────┬─────────────────────┘  │
         └───────────────────────┼────────────────────────┘
                                 │ Private VPC Network Only
                                 │ (Port 6432 / Encrypted)
                                 ▼
         ┌────────────────────────────────────────────────┐
         │          VPS 2: DATABASE SERVER                │
         │  ┌──────────────────────────────────────────┐  │
         │  │          UFW Firewall (Private IP)       │  │
         │  └────────────────────┬─────────────────────┘  │
         │  ┌────────────────────▼─────────────────────┐  │
         │  │          PgBouncer Connection Pooler    │  │
         │  │          (Port 6432)                     │  │
         │  └────────────────────┬─────────────────────┘  │
         │  ┌────────────────────▼─────────────────────┐  │
         │  │          PostgreSQL Database Server      │  │
         │  │          (Port 5432)                     │  │
         │  └──────────────────────────────────────────┘  │
         └────────────────────────────────────────────────┘
```

### Step 1: Database Server Setup (VPS 2 - Private IP `10.0.0.20`)

1. **Install PostgreSQL and PgBouncer**:
   ```bash
   sudo apt update && sudo apt install -y postgresql postgresql-contrib pgbouncer ufw
   ```

2. **Configure UFW Firewall**:
   Allow SSH from your admin IP and restrict PostgreSQL/PgBouncer access exclusively to the App Server's private IP (`10.0.0.10`):
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow from 10.0.0.10 to any port 6432 proto tcp
   sudo ufw enable
   ```

3. **Configure PgBouncer (`/etc/pgbouncer/pgbouncer.ini`)**:
   ```ini
   [databases]
   halisi_db = host=127.0.0.1 port=5432 dbname=halisi_db

   [pgbouncer]
   listen_addr = 10.0.0.20
   listen_port = 6432
   auth_type = md5
   auth_file = /etc/pgbouncer/userlist.txt
   pool_mode = transaction
   max_client_conn = 500
   default_pool_size = 20
   ```

4. **Start & Enable Services**:
   ```bash
   sudo systemctl restart postgresql
   sudo systemctl restart pgbouncer
   ```

---

### Step 2: Next.js App Server Setup (VPS 1 - Private IP `10.0.0.10`)

1. **Install Node.js 22, PM2, and Caddy**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs caddy ufw
   sudo npm install -g pm2
   ```

2. **Configure UFW Firewall on VPS 1**:
   ```bash
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Clone & Build Next.js Application**:
   ```bash
   git clone https://github.com/Allanshikomere/halisi-gifts.git /var/www/halisi
   cd /var/www/halisi
   cp .env.example .env
   ```
   Fill in every required value (see [Environment variables](#environment-variables)), with `NEXT_PUBLIC_SITE_URL` and `NEXTAUTH_URL` set to the real domain. Set `DATABASE_URL` in `.env` to point to PgBouncer on VPS 2:
   ```env
   DATABASE_URL="postgresql://halisi_user:your_password@10.0.0.20:6432/halisi_db?schema=public&pgbouncer=true"
   ```
   Build and start PM2 process:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   pm2 start npm --name "halisi-app" -- start
   pm2 save
   pm2 startup
   ```
   Schedule the abandoned-cart job (e.g. hourly via cron):
   ```bash
   curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://halisigifts.com/api/cron/abandoned-carts
   ```

4. **Configure Caddy (`/etc/caddy/Caddyfile`)**:
   ```caddy
   halisigifts.com, www.halisigifts.com {
       reverse_proxy 127.0.0.1:3000
   }
   ```
   The app already sends its own security headers (CSP, `X-Frame-Options`, `nosniff`, HSTS in production), so Caddy only needs to proxy.
   Reload Caddy for instant automatic HTTPS provisioning:
   ```bash
   sudo systemctl reload caddy
   ```

---

## License

© 2026 Halisi Gifts. All rights reserved.
