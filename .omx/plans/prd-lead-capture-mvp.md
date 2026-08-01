# PRD: AdviceConnect Lead-Capture MVP

## Requirements Summary

Build the first working MySaas / AdviceConnect frontend and backend slice:

- React frontend with a public lead-capture experience.
- Node backend API with health and lead endpoints.
- Local durable lead storage for development.
- Documentation and verification commands.

This is a local code milestone. It must not deploy or alter the live Azure/Proxmox path without a separate approval. Browser code must default to same-origin `/api`; private VM addresses are deployment/proxy concerns only.

## RALPLAN-DR Summary

### Principles

1. Exercise both frontend and backend in the first slice.
2. Keep live infrastructure untouched until the code is verified.
3. Preserve the hybrid architecture: Azure edge, Proxmox private backend.
4. Favor simple, auditable MVP components over premature SaaS complexity.

### Decision Drivers

1. Fast path to a visible working product.
2. Low deployment risk.
3. Clear evolution path toward account, organization, agent, and lead management.

### Viable Options

| Option | Fast visible product | Low deployment risk | Evolution path | Tradeoff |
| --- | --- | --- | --- | --- |
| Lead-capture MVP with React + Express + SQLite | Strong: creates a real form-to-API-to-storage flow | Strong: local-only and loopback by default | Good if ingestion is treated as an adapter and not final domain design | Must protect PII and keep lead listing dev-only |
| SaaS shell with login/dashboard placeholders | Medium: looks like SaaS, but core lead behavior is fake | Strong: mostly static UI/API health | Good for later auth/org work | Delays proof of lead capture, extraction-adjacent data, and backend persistence |
| Backend-first API only | Weak: no public product experience | Strong: no frontend deployment concerns | Strong for domain model | Does not meet the user's frontend+backend start request |

Chosen option: lead-capture MVP with React + Express + SQLite. It wins overall: best on visible product, tied on deployment risk, and acceptable on evolution path if the backend is structured around an ingestion/repository boundary.

## Deliberate Pre-Mortem

| Failure | Detection Signal | Mitigation | Stop / Rollback Condition |
| --- | --- | --- | --- |
| PII exposure through logs, public lead listing, or committed database files | tests find lead payloads in logs, `GET /api/leads` works in production, git status shows `.env`/SQLite/data files | do not log request bodies, production lead list always 404, `.gitignore` protects data and env files | stop before code-review if any PII appears in logs or git-tracked files |
| SQLite corruption, lock, or data loss | integration test cannot bootstrap schema, cannot reopen existing DB, or concurrent write test fails | schema version table, parameterized writes, isolated DB per test, repository re-instantiation test | block release if persistence cannot survive process/repository re-instantiation |
| Endpoint abuse or misconfiguration | oversized body accepted, CORS wildcard in production, body-size limit missing, private VM IP embedded in browser build | 64kb JSON body limit, explicit `CORS_ORIGIN`, same-origin frontend default, production-safe route guards | stop if production settings allow wildcard CORS, lead listing, or private backend IPs in browser output |

## Runtime And Package Contract

| Item | Contract |
| --- | --- |
| Node.js | Support Node `22.x`; implementation may remain compatible with Node `20.x` if dependency choices allow it |
| npm | Use npm workspaces from root `package.json` |
| Lockfile | Commit one root `package-lock.json`; verification uses `npm ci` after lockfile exists |
| Backend package | `backend/package.json`, TypeScript, Express, SQLite driver, Vitest/Supertest tests |
| Frontend package | `frontend/package.json`, TypeScript, React, Vite, Vitest + Testing Library tests |
| Root scripts | `npm run build`, `npm test`, `npm run lint` if lint script is introduced |
| SQLite driver | Use a Node SQLite library with parameterized statements; isolate DB access behind a repository module |
| Validation | Use explicit TypeScript validation functions or a lightweight schema library; validation behavior must match the API contract |
| E2E runner | Playwright owns browser E2E under root `e2e/` |
| Package ownership | root owns workspace scripts and E2E; `backend/` owns API, validation, persistence, backend tests; `frontend/` owns React UI, static health artifact, frontend tests |

## Git And Clean-Checkout Contract

The intended project repository is:

```text
https://github.com/Laurentcadieux/mysaas
```

The working folder is currently:

```text
/home/work10/.openclaw/workspace/MySaas
```

Implementation must treat `MySaas/` as the repository payload for `Laurentcadieux/mysaas`, even though the parent workspace has a different Git remote. Before final completion, verify from a clean temporary checkout or worktree of the MySaas repo payload, not from unrelated parent-workspace tracked state.

Clean-checkout verification command shape:

```bash
tmpdir="$(mktemp -d)"
git clone git@github.com:Laurentcadieux/mysaas.git "$tmpdir/mysaas"
cd "$tmpdir/mysaas"
node -v
npm ci
npm run build
npm test
npm run e2e
```

If the remote is not yet updated with the implementation commit, use a temporary local git init/clone of the MySaas payload with the same tracked file set and document that as the pre-push substitute.

## Environment And Network Contract

| Variable | Default | Meaning / Safety Rule |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | backend bind host for local development; private VM interface binding requires deployment approval |
| `PORT` | `4000` | backend port |
| `DATABASE_PATH` | `./data/adviceconnect.sqlite` | local SQLite path, git-ignored |
| `CORS_ORIGIN` | `http://127.0.0.1:5173` | explicit development frontend origin; no wildcard in production |
| `BODY_LIMIT` | `64kb` | maximum JSON body size |
| `ENABLE_DEV_LEAD_LIST` | `false` | enables lead listing only outside production |
| `NODE_ENV` | `development` | when `production`, `GET /api/leads` is always 404 and wildcard CORS is forbidden |
| `VITE_API_BASE_URL` | empty | frontend defaults to same-origin `/api`; override for local development only |

Lead payloads must not be logged. Logs may include request id, route, status code, and duration.

Favored option: lead-capture MVP with React + Express + SQLite.

## Implementation Steps

1. Create backend package under `backend/`:
   - TypeScript Express app.
   - SQLite persistence module.
   - validation for lead payloads.
   - endpoints `GET /health`, `POST /api/leads`, and dev-only `GET /api/leads`.
   - default bind host `127.0.0.1`.
   - structured errors and parameterized SQLite writes.
   - production guard: lead listing returns 404 whenever `NODE_ENV=production`, even if `ENABLE_DEV_LEAD_LIST=true`.
2. Create frontend package under `frontend/`:
   - TypeScript React/Vite app.
   - AdviceConnect homepage/lead-capture form.
   - API client using same-origin `/api` by default, with `VITE_API_BASE_URL` override only for development.
   - Vite proxy from `/api` to backend in development.
   - frontend `/health` support.
   - success/error states.
   - duplicate-submit protection.
3. Add root developer scripts:
   - install both apps,
   - build both apps,
   - test both apps.
4. Add data-safety files:
   - `.gitignore` for `.env`, SQLite, and local data files.
   - committed `.env.example` files.
   - isolated test database setup.
5. Update docs:
   - root README,
   - frontend README,
   - backend README,
   - ops README if ports/routes are introduced.
6. Verify locally:
   - backend tests,
   - frontend build,
   - frontend tests,
   - package audits where available,
   - API smoke checks if server can run safely.

## Testable Acceptance Criteria

- Backend `npm test` passes.
- Backend `npm run build` passes.
- Backend test proves SQLite persistence across repository re-instantiation.
- Frontend `npm run build` passes.
- Frontend tests cover form success, validation failure, backend failure, and duplicate-click suppression.
- `POST /api/leads` rejects missing required fields.
- `POST /api/leads` accepts valid lead data and returns an id, status, timestamps, and indicator fields.
- `GET /api/leads` returns created leads only when `ENABLE_DEV_LEAD_LIST=true`; otherwise it returns 404.
- `GET /api/leads` returns 404 when `NODE_ENV=production`, even if `ENABLE_DEV_LEAD_LIST=true`.
- Frontend uses same-origin `/api` by default and does not bake private backend VM IPs into browser code.
- Frontend includes health check support and user-visible success/error states.
- Docs mention local ports and environment variables.
- `.env`, SQLite, and local data outputs are git-ignored.

## API Contract

### `GET /health`

Returns HTTP `200`:

```json
{
  "status": "ok",
  "service": "adviceconnect-backend"
}
```

### `POST /api/leads`

Request body:

| Field | Required | Type | Limit | Normalization / Meaning |
| --- | --- | --- | --- | --- |
| `firstName` | yes | string | 1-80 chars | trim whitespace |
| `lastName` | no | string | 0-80 chars | trim whitespace, default empty string |
| `email` | yes | string | 3-254 chars | trim/lowercase; must be email-shaped |
| `phone` | no | string | 0-40 chars | trim whitespace |
| `company` | no | string | 0-120 chars | trim whitespace |
| `serviceInterest` | no | string | 0-160 chars | trim whitespace |
| `businessChallenge` | yes | string | 1-1000 chars | trim whitespace; stored as plain data |
| `budget` | no | string | 0-80 chars | trim whitespace |
| `timeline` | no | string | 0-80 chars | trim whitespace |
| `preferredContactMethod` | no | enum | email/phone/either | default `email` |
| `consentToFollowUp` | yes | boolean | n/a | must be `true` |
| `source` | no | string | 0-80 chars | default `website-form` |

Unknown fields are ignored. Oversized strings or invalid types return HTTP `400`.

Success response returns HTTP `201`:

```json
{
  "lead": {
    "id": "uuid",
    "firstName": "Ava",
    "lastName": "Smith",
    "email": "ava@example.com",
    "phone": "",
    "company": "",
    "serviceInterest": "",
    "businessChallenge": "Need better qualified website leads",
    "budget": "",
    "timeline": "",
    "preferredContactMethod": "email",
    "consentToFollowUp": true,
    "source": "website-form",
    "status": "new",
    "qualificationLevel": "unreviewed",
    "urgency": "unknown",
    "purchaseIntent": "unknown",
    "createdAt": "2026-08-01T00:00:00.000Z",
    "updatedAt": "2026-08-01T00:00:00.000Z"
  }
}
```

Timestamp format is ISO 8601 UTC. `qualificationLevel`, `urgency`, and `purchaseIntent` are defaults only; this first slice must not claim AI extraction.

Error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Lead submission is invalid.",
    "fields": {
      "email": "Email is required."
    }
  }
}
```

### `GET /api/leads`

Development-only route. It returns HTTP `404` unless `NODE_ENV` is not `production` and `ENABLE_DEV_LEAD_LIST=true`.

## SQLite Contract

- Schema initialization runs automatically on repository creation.
- Database contains a `schema_meta` table with `version=1`.
- A clean database file bootstraps without manual commands.
- Tests use isolated temporary database files.
- Persistence tests must recreate the repository/service against the same file and prove the lead remains readable.

## Frontend Health Contract

The built frontend must include `/health` as a static JSON file or route returning HTTP `200` with:

```json
{
  "status": "ok",
  "service": "adviceconnect-frontend"
}
```

Tests or smoke checks must assert the health artifact exists in the build output.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| SQLite MVP storage is not production multi-tenant storage | Document it as local MVP storage and isolate behind a repository module |
| No auth in first slice | Keep endpoints clearly MVP/local and avoid deploying publicly without auth decision |
| Live site confusion | Do not deploy in this pass; document deployment as next step |
| Dependency drift | Pin major versions in package manifests and use lockfiles |
| PII exposure through lead list | Keep list endpoint development-only and disabled by default |

## Verification Steps

```bash
npm ci
npm run build
npm test
npm --prefix backend run build
npm --prefix backend test
npm --prefix frontend run build
npm --prefix frontend test
npm run e2e
```

The `npm run e2e` command must launch isolated backend and frontend services on local test ports, submit a synthetic lead through the browser UI, verify normalized data persisted in SQLite through the development-only list route, check backend and frontend health, and tear down child processes.

## ADR

### Decision

Build a local lead-capture MVP first using React/Vite frontend, Express backend, and SQLite local persistence, with same-origin `/api` browser defaults and dev-only lead listing.

### Drivers

- The user requested both frontend and backend work.
- The charter's MVP centers on lead capture and structured lead data.
- This path avoids live infrastructure changes while producing a real product slice.
- Architect review required safe exposure defaults, dev-only lead retrieval, ignored data files, and explicit frontend health support before implementation.

### Alternatives Considered

- SaaS shell first: strong visual progress and a better place for future auth, but it leaves lead capture and backend persistence fake, so it fails the first-build requirement to exercise both tiers.
- Backend-only first: stronger domain continuity and less browser complexity, but it does not provide a usable product surface and underserves the user's request to start frontend and backend together.
- Lead-capture MVP: best validates the charter's lead-generation outcome now, with the explicit cost that auth, tenancy, and production database hardening are deferred and must be protected by route guards and local-only scope.

### Why Chosen

It provides the smallest useful end-to-end proof of AdviceConnect.

### Consequences

- Auth, organizations, billing, and ElevenLabs remain next milestones.
- Persistence must later migrate from MVP SQLite to production database design.
- Administrative lead review remains blocked on authentication and tenant boundaries.

### Follow-Ups

- Add organization/auth model.
- Add project and agent configuration.
- Add ElevenLabs webhook receiver.
- Add production deployment plan for VM `106` and VM `107`.

## Follow-Up Staffing Guidance

- `$ultragoal`: default owner for implementing and checkpointing this plan.
- Native `executor`: frontend/backend implementation can be split later if needed.
- Native `test-engineer`: useful after implementation to harden test coverage.
- `$team`: not launched from this Codex App surface because tmux is unavailable; use native subagents for bounded parallel work in this session.
