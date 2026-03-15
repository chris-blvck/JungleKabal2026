# Angel Ops — Deploy Fast Guide

## 1. Build front-end
```bash
npm ci
npm run build
```

## 2. Run API
```bash
export ACADEMY_API_PORT=8787
export ANGEL_OPS_ADMIN_TOKEN="replace-with-strong-secret"
export CORS_ALLOW_ORIGIN="https://your-frontend-domain"
export ANGEL_OPS_RATE_LIMIT_WINDOW_MS=60000
export ANGEL_OPS_RATE_LIMIT_MAX=60
node server/index.mjs
```

## 3. Wire front-end env
Set in your frontend deploy provider:
- `VITE_ANGEL_OPS_API_BASE=https://<your-api-domain>`
- `VITE_ANGEL_OPS_ADMIN_TOKEN=<optional-admin-token>`

## 4. Health checks
- `GET /health`
- `GET /api/angel-ops/health` (includes CORS + rate-limit config echo)

## 5. Smoke test
```bash
curl -sS https://<api>/api/angel-ops/health
curl -sS https://<api>/api/angel-ops/state
curl -sS -X PUT https://<api>/api/angel-ops/wallets \
  -H 'Content-Type: application/json' \
  -H 'X-Admin-Token: <token>' \
  -d '{"trading":"9b1GJp28NbTM1F5CsvEoFoAHcRnuK5QjdH9JdPQYW8KR"}'
```

## 6. Immediate next hardening
- Restrict CORS origin to your production domain.
- Move write actions behind authenticated backend (no public admin token in client).
- Migrate JSON persistence to managed DB.
