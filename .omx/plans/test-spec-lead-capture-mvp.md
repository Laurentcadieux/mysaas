# Test Spec: AdviceConnect Lead-Capture MVP

## Unit Coverage

Backend:

- Validate required lead fields.
- Normalize optional lead fields.
- Create lead with generated id and timestamps.
- List leads in newest-first order.
- Reject malformed JSON or invalid request shapes.
- Verify health endpoint returns `ok`.
- Verify lead listing returns 404 unless `ENABLE_DEV_LEAD_LIST=true`.
- Verify lead listing returns stored leads when explicitly enabled in tests.
- Verify lead listing returns 404 when `NODE_ENV=production`, even if `ENABLE_DEV_LEAD_LIST=true`.
- Verify SQLite persistence survives repository re-instantiation against the same database file.
- Verify clean-database bootstrap creates schema and `schema_meta` version `1`.
- Verify request contract: exact known fields are normalized, unknown fields are ignored, required consent is enforced, oversized strings fail, and errors use the documented envelope.
- Verify CORS origin defaults to `http://127.0.0.1:5173`, rejects wildcard production configuration, and honors explicit `CORS_ORIGIN`.
- Verify body limit is configured as `64kb`.
- Verify logs do not include lead payload fields.

Frontend:

- Build succeeds.
- Form contains required capture fields.
- API client uses `VITE_API_BASE_URL` fallback.
- Success and failure messages are represented in UI logic.
- Default API path is same-origin `/api`.
- Duplicate submit clicks do not create concurrent duplicate requests.
- Frontend health check is present in the built app.
- Interaction tests assert validation prevents requests, success submits once, backend failure renders an error, and repeated clicks do not create concurrent duplicate requests.

## Integration Coverage

- Backend Supertest suite covers `GET /health`, `POST /api/leads`, dev-only `GET /api/leads`, production lead-list denial, validation failures, oversized payload behavior, and SQLite persistence.
- SQLite tests use temporary database files and delete them after completion.
- Frontend tests use mocked API responses and assert actual user interactions with the form.

## Full-Stack E2E Coverage

Runner: Playwright, owned by the root package under `e2e/`.

Command:

```bash
npm run e2e
```

Required behavior:

1. Start backend with isolated `DATABASE_PATH`, test `PORT`, `ENABLE_DEV_LEAD_LIST=true`, and non-production `NODE_ENV`.
2. Start frontend with test `VITE_API_BASE_URL` or proxy configuration.
3. Submit a synthetic lead through the browser UI.
4. Assert success state is shown.
5. Query the dev-only list endpoint and verify normalized persisted data.
6. Check backend `GET /health`.
7. Check frontend `/health`.
8. Stop all child processes and remove test database files.

Clean-checkout e2e must run under Node 22 after `npm ci`; local generated data must not be required.

## Observability Coverage

- Health endpoints include service names and `status:"ok"`.
- Backend logs request route/status/duration only, without lead payload fields.
- Failed validation returns a structured error envelope suitable for UI display.
- Smoke/e2e scripts fail on non-zero child exits and do not trust success-looking output alone.

## Smoke Coverage

When safe to run servers:

1. Start backend on a local port.
2. `curl /health`.
3. `POST /api/leads` with valid data.
4. Confirm `GET /api/leads` is disabled by default.
5. Start backend with `ENABLE_DEV_LEAD_LIST=true`.
6. `GET /api/leads` and confirm the lead appears.
7. Build frontend.

## Security Checks

- No secrets committed.
- No live credential values in README files.
- Backend validates input size and required fields.
- Backend CORS is explicit and environment-controlled.
- Private backend VM IPs are not embedded into browser defaults.
- `.env`, SQLite, and local data outputs are ignored by git.
- Production mode forbids wildcard CORS and lead listing.
- Synthetic data only; no real customer data in tests, examples, screenshots, or fixtures.

## UltraQA Seed Scenarios

| ID | Scenario | Expected |
| --- | --- | --- |
| UQA-001 | Valid lead submission | 201 response with structured lead |
| UQA-002 | Missing email/name/challenge | 400 response |
| UQA-003 | Oversized strings | 400 response |
| UQA-004 | Prompt-injection-like text in challenge field | stored as plain data, no instruction execution |
| UQA-005 | Repeated submissions | each valid lead has unique id |
| UQA-006 | Misleading success output check | tests must rely on exit codes plus assertions |
| UQA-007 | Anonymous lead list access | disabled unless explicit development flag is set |
| UQA-008 | Browser API config | same-origin `/api`, no private VM IP baked in |
| UQA-009 | Production lead list guard | 404 even if dev flag is accidentally set |
| UQA-010 | Clean SQLite bootstrap | schema and version initialize automatically |

## Completion Evidence

- Command outputs from build/test.
- Code review result.
- UltraQA report or explicit scenario evidence.
