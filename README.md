# PhoneVault Backend

A REST API backend for **PhoneVault** — a smartphone information, search, filtering, and comparison platform. Built with Node.js, Express, PostgreSQL, and Prisma.

```
Builder.io frontend  →  PhoneVault REST API  →  Express.js  →  Prisma  →  PostgreSQL
```

---

## 1. Install dependencies

```bash
npm install
```

This installs Express, Prisma, security middleware (helmet, cors, express-rate-limit), express-validator, and dev dependencies (Jest, Supertest, nodemon).

---

## 2. Configure PostgreSQL

You need a running PostgreSQL server. Options:

- **Local install**: install PostgreSQL, then create a database:
  ```sql
  CREATE DATABASE phonevault;
  ```
- **Docker** (quickest for local dev):
  ```bash
  docker run --name phonevault-db -e POSTGRES_PASSWORD=password \
    -e POSTGRES_DB=phonevault -p 5432:5432 -d postgres:16
  ```
- **Hosted** (Railway, Supabase, Neon, Render, etc.): create a database and copy its connection string.

---

## 3. Configure `.env`

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Port the API listens on (default `5000`) |
| `NODE_ENV` | `development`, `production`, or `test` |
| `ADMIN_API_KEY` | Secret required to call `/api/admin/*` routes. Generate one with `openssl rand -hex 32` |
| `CORS_ORIGIN` | Comma-separated list of allowed frontend origins (your Builder.io URL) |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` | Rate limiting tuning |

`.env` is git-ignored — never commit it. `ADMIN_API_KEY` and `DATABASE_URL` must never be exposed in any frontend code.

---

## 4. Run Prisma migrations

This creates the `phones` table from `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name init
```

This also generates the Prisma Client. If you ever change `schema.prisma` again, re-run `npx prisma migrate dev --name <change-description>`.

---

## 5. Seed the database

Populates ~20 realistic sample phones across Apple, Samsung, OnePlus, Google, Xiaomi, Redmi, POCO, Nothing, Motorola, Realme, OPPO, Vivo, and iQOO:

```bash
npm run seed
```

The seed is **idempotent** — it uses `upsert` on `slug`, so running it again updates existing rows instead of duplicating them. Sample specs are realistic placeholder data for development/testing only, not officially verified manufacturer data.

---

## 6. Start the server

```bash
npm run dev      # nodemon, auto-restarts on changes
npm start        # plain node, for production
```

By default the API runs at `http://localhost:5000`. Visit `http://localhost:5000/api/health` to confirm it's running.

---

## 7. API Reference

All responses share a consistent envelope.

**Success:**
```json
{ "success": true, "data": ..., "meta": { "pagination": { ... } } }
```

**Error:**
```json
{ "success": false, "error": { "code": "PHONE_NOT_FOUND", "message": "Phone not found" } }
```

### Public endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/phones` | List phones. Query: `page`, `limit`, `search`, `brand`, `minPrice`, `maxPrice`, `ram`, `storage`, `operatingSystem`, `sort` (e.g. `price`, `-price`, `rating`, `-releaseDate`) |
| GET | `/api/phones/search?q=...` | Search phones by brand/model |
| GET | `/api/phones/:id` | Get one phone by numeric id |
| GET | `/api/phones/slug/:slug` | Get one phone by slug |
| GET | `/api/phones/price-range` | Min/max/average price, plus per-brand ranges |
| GET | `/api/phones/compare?ids=1,2,3` | Compare 2–3 phones (max 3) |
| GET | `/api/brands` | List of brands that actually exist in the database (derived live from the data — never hard-coded) |
| GET | `/api/brands/:brand/phones` | All phones for one brand |

**Examples:**
```
GET /api/phones?brand=Samsung&minPrice=500&maxPrice=1200&sort=-price&page=1&limit=10
GET /api/phones/search?q=galaxy
GET /api/phones/compare?ids=1,4,9
```

### Admin endpoints (protected)

All require header: `x-admin-api-key: <ADMIN_API_KEY>`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/phones` | List all phones (admin view, paginated) |
| POST | `/api/admin/phones` | Create a phone |
| PUT | `/api/admin/phones/:id` | Update a phone (partial update) |
| DELETE | `/api/admin/phones/:id` | Delete a phone |

Example:
```bash
curl -X POST http://localhost:5000/api/admin/phones \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: YOUR_ADMIN_KEY" \
  -d '{"brand":"Apple","model":"iPhone 17","slug":"apple-iphone-17","price":999}'
```

### Error codes

| Code | HTTP status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request parameters/body failed validation |
| `INVALID_PHONE_IDS` | 400 | One or more compare ids aren't valid positive integers |
| `TOO_MANY_COMPARE_IDS` | 400 | More than 3 ids passed to `/compare` |
| `NOT_ENOUGH_COMPARE_IDS` | 400 | Fewer than 2 valid ids passed to `/compare` |
| `UNAUTHORIZED` | 401 | Missing/incorrect `x-admin-api-key` |
| `PHONE_NOT_FOUND` | 404 | Phone id/slug doesn't exist |
| `BRAND_NOT_FOUND` | 404 | Brand has no phones in the database |
| `ROUTE_NOT_FOUND` | 404 | No matching route |
| `DUPLICATE_SLUG` | 409 | Creating/updating a phone with a slug that's already taken |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `DATABASE_ERROR` / `INTERNAL_SERVER_ERROR` | 500 | Unexpected server/database error (details never leaked in production) |

---

## 8. How admin authentication works

Admin routes are protected by a single shared secret, `ADMIN_API_KEY`, set in the backend's `.env` file. Requests to `/api/admin/*` must include it as a header:

```
x-admin-api-key: <the same value as ADMIN_API_KEY>
```

The middleware (`src/middleware/adminAuth.js`) uses a timing-safe comparison and rejects the request with `401 UNAUTHORIZED` if the header is missing or doesn't match. This key is a server-side secret — it must **never** appear in any frontend JavaScript, Builder.io config, or public repo. If your Builder.io frontend needs to call admin routes, do it from a server-side function/proxy that holds the key, not from client-side code.

---

## 9. Running tests

Tests use Jest + Supertest and run against your configured database (use a separate test database if you don't want test data mixed with real data — just point `DATABASE_URL` in `.env` to it, or export it inline):

```bash
npm test
```

The test suite covers: listing/filtering phones, search, get-by-id/slug, brands, phones-by-brand, comparing 2 and 3 phones, rejecting >3 compare ids, not-found cases, invalid parameters, admin auth rejection, and full admin create/update/delete flows, plus error-handler mapping for database and unexpected errors.

Tests clean up after themselves (anything with a `test-` slug prefix is deleted in `afterAll`), so they're safe to run against a shared dev database, though a dedicated test database is still recommended.

---

## 10. Connecting the Builder.io frontend

1. Deploy this backend somewhere reachable over HTTPS (Railway, Render, Fly.io, a VPS, etc.), or run it locally and expose it with a tunnel (e.g. `ngrok http 5000`) while prototyping.
2. Set `CORS_ORIGIN` in your deployed backend's `.env` to your Builder.io site's URL (and `localhost` while developing), e.g.:
   ```
   CORS_ORIGIN="https://your-project.builder.io,http://localhost:3000"
   ```
3. In Builder.io, use **Data / Custom Code** (fetch or axios) to call your API base URL, e.g.:
   ```js
   const res = await fetch("https://your-backend-url.com/api/phones?brand=Samsung");
   const { data, meta } = await res.json();
   ```
4. Never put `ADMIN_API_KEY` into any Builder.io component, custom code block, or client-side fetch — those all run in the browser and are visible to anyone. Only use the admin endpoints from a trusted server-side context.
5. Public endpoints (`/api/phones`, `/api/brands`, `/api/phones/compare`, etc.) require no authentication and are safe to call directly from Builder.io's client-side code.

---

## Project structure

```
src/
  controllers/   → request/response handling (thin)
  routes/        → Express route definitions
  services/      → business logic + Prisma queries
  middleware/    → auth, validation, rate limiting, error handling
  validators/    → express-validator rule sets
  utils/         → Prisma client singleton, ApiError, response helpers
  app.js         → Express app (exported for tests)
  server.js      → starts the HTTP server

prisma/
  schema.prisma  → Phone data model
  seed.js        → ~20 sample phones across multiple brands

tests/           → Jest + Supertest integration tests
```

## Scaling notes

- Brands are derived live from the `phones` table (`SELECT DISTINCT brand`) — adding a new brand is just adding phones with that brand value; no code or API changes needed.
- `brand`, `model`, and `slug` are indexed for fast filtering/search at larger scale.
- Pagination is built into every list endpoint, so the dataset can grow from ~20 to thousands of phones without changing the API shape.
