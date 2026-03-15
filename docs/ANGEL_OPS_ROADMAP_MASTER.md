# Angel Ops — Master Roadmap (Remaining Work)

## 0) Deployment Fast Track (Do first)
- [ ] Provision API runtime for `server/index.mjs` (Render/Fly/Railway/VM).
- [ ] Set env vars:
  - [ ] `ACADEMY_API_PORT`
  - [ ] `ANGEL_OPS_ADMIN_TOKEN`
  - [ ] `VITE_ANGEL_OPS_API_BASE`
  - [ ] `VITE_ANGEL_OPS_ADMIN_TOKEN` (optional)
- [ ] Configure persistent volume for `server/data/angel-ops.json` **or** migrate directly to DB.
- [ ] Put API behind HTTPS and ensure CORS policy is restricted in production.
- [ ] Add basic uptime monitor on `/api/angel-ops/health`.

## 1) Security Hardening
- [ ] Replace static admin token model with proper auth (JWT/session + role checks).
- [ ] Move admin operations to server-only context (avoid exposing write token in client builds).
- [ ] Add rate limits per IP for write endpoints.
- [ ] Add audit logs for wallet updates and snapshot deletion.

## 2) Data Layer (Scale)
- [ ] Migrate file storage to Postgres/Supabase.
- [ ] Add schema:
  - [ ] `angel_wallet_config`
  - [ ] `angel_snapshots`
  - [ ] `angel_events_audit`
- [ ] Add retention policy (e.g. keep 90 days high-resolution + rollups).

## 3) Automation
- [ ] Server cron/worker for automatic refresh (every 1–5 min).
- [ ] Retry queue + dead-letter handling for transient RPC/provider failures.
- [ ] Warm cache for price feed to limit external API pressure.

## 4) Product / UX
- [ ] Add wallet-level delta cards (1h/24h/7d).
- [ ] Add drawdown alert ribbon and threshold controls.
- [ ] Add timeline filters (1d/7d/30d/custom).
- [ ] Add compact mobile layout pass for Telegram webview.

## 5) Observability
- [ ] Structured logs (JSON) with request IDs.
- [ ] Metrics: refresh success rate, stale rate, RPC error rate, p95 latency.
- [ ] Alerting rules (Telegram/Slack/Discord):
  - [ ] stale > N min
  - [ ] refresh errors > threshold
  - [ ] drawdown beyond threshold

## 6) QA / Testing
- [ ] API integration tests for all Angel Ops routes.
- [ ] Frontend tests for dashboard state transitions.
- [ ] E2E smoke tests for critical flows (save wallets, refresh, export, clear).
- [ ] Pre-deploy checklist gate in CI.

## 7) Nice-to-have (Post-MVP)
- [ ] Multi-portfolio support.
- [ ] Investor-level permission model.
- [ ] Advanced analytics (Sharpe-like metrics, volatility bands).
- [ ] Webhook ingestion from external trading events.
