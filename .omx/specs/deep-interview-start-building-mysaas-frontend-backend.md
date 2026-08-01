# Deep Interview Spec: MySaas Lead-Capture MVP

## Metadata

- Skill path: `$autopilot -> $deep-interview`
- Profile: standard
- Context type: brownfield
- Context snapshot: `.omx/context/start-building-mysaas-frontend-backend-20260801T001949Z.md`
- Final ambiguity: 0.18
- Threshold: 0.20
- Completion rationale: the user answered `/start` after the first scope question. For this build request, the most execution-relevant interpretation is the lead-capture MVP because it exercises both the frontend and backend immediately. Remaining product choices are bounded enough for the agent to choose conservative defaults.

## Intent

Start converting MySaas / AdviceConnect from documentation into a working SaaS application slice.

## Desired Outcome

Build a first working frontend/backend slice that demonstrates:

- public-facing AdviceConnect lead capture UI,
- backend API health,
- backend lead submission,
- basic lead persistence,
- local developer run commands,
- tests or smoke checks for the core flow.

## In Scope

- Create a local frontend app under `frontend/`.
- Create a local backend app under `backend/`.
- Use the project charter's AdviceConnect positioning and lead fields.
- Provide a backend endpoint for lead creation.
- Store leads in a simple local persistence layer suitable for MVP development.
- Keep lead retrieval development-only until authentication exists.
- Provide health endpoints for frontend/backend.
- Document run, test, and future deployment steps.

## Out Of Scope / Non-Goals

- Full authentication and organization login.
- Billing and Stripe integration.
- Live ElevenLabs webhook integration.
- Production database hardening.
- New Azure/Proxmox deployment changes.
- Replacing the currently deployed hello-world public site during this first code pass.
- Renaming existing infrastructure resources.

## Decision Boundaries

OMX may decide without further confirmation:

- Use TypeScript for frontend and backend.
- Use React/Vite for the frontend because the existing host already runs a React/Node service.
- Use Node/Express for the backend because it keeps the first full-stack slice small and easy to deploy on VM `107`.
- Use SQLite as local MVP storage with a file path configured by environment variable.
- Use conservative validation and explicit JSON API contracts.
- Add focused automated tests and docs.
- Use same-origin `/api` as the frontend default, with a Vite development proxy to the local backend.

OMX must ask before:

- Deploying to the live Azure/Proxmox path.
- Adding paid SaaS services.
- Storing real customer data.
- Introducing managed cloud databases or external auth/billing providers.
- Changing live Azure DNS, nginx, VPN, or Proxmox networking.

## Constraints

- Keep Azure as the public edge and Proxmox as the private workload zone.
- Do not commit secrets.
- Keep the backend private by default.
- Update docs for any service, port, or route added.
- Preserve existing docs and infrastructure awareness.

## Acceptance Criteria

1. `frontend/` contains a runnable AdviceConnect lead-capture UI.
2. `backend/` contains a runnable API with:
   - `GET /health`,
   - `POST /api/leads`,
   - development-only `GET /api/leads` guarded by `ENABLE_DEV_LEAD_LIST=true`.
3. Lead submission validates required fields and returns a structured lead record.
4. Lead records persist locally during development.
5. Frontend can be configured with `VITE_API_BASE_URL`.
6. Backend CORS allows the frontend development origin.
7. README files explain local run, test, environment, ports, and deployment notes.
8. Verification commands pass for install/build/test or the gap is explicit.
9. Environment files and SQLite/data files are ignored by git.
10. Frontend includes `/health` support for deployment checks.

## Pressure-Pass Findings

The first scope question forced a choice between a SaaS shell and a lead-capture MVP. `/start` was interpreted as approval to proceed with the agent-selected default. The lead-capture MVP is preferred because the user explicitly asked to start building both frontend and backend, and a shell with placeholder API would under-exercise the backend.

## Brownfield Evidence

- `README.md` identifies AdviceConnect as the MySaas product.
- `docs/project-charter.md` defines the lead-generation MVP, lead table, and variables/indicators.
- `docs/infrastructure-awareness.md` defines Azure/Proxmox topology.
- `frontend/README.md` reserves VM `106` and port guidance.
- `backend/README.md` reserves VM `107` and backend private-service guidance.

## Handoff

Proceed to `$ralplan` with this spec. Ralplan should produce a short consensus plan and test spec, then hand off to `$ultragoal` for local implementation only.
