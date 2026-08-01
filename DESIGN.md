# Design

## Source of truth

- Status: Active
- Last refreshed: 2026-08-01
- Primary product surfaces: Public go-to-market entry, workspace setup, lead capture preview, future customer portal.
- Evidence reviewed: `docs/project-charter.md`, `docs/architecture.md`, `README.md`, `frontend/src/App.tsx`, `frontend/src/styles.css`.

## Brand

- Personality: Practical, credible, direct, revenue-focused.
- Trust signals: Clear outcome language, fixed monthly pricing, structured lead data, private backend deployment, fast setup.
- Avoid: Generic admin scaffolding, infrastructure language on customer-facing screens, playful decorative styling, vague AI hype.

## Product Goals

- Goals: Present AdviceConnect as a sellable SaaS, make the first workspace creation obvious, show the lead-generation value path.
- Non-goals: Full CRM UI, full billing checkout, full agent builder, infrastructure management.
- Success signals: Visitor understands the offer quickly, owner can create the first organization/project/agent, smoke tests prove workspace and lead creation.

## Personas And Jobs

- Primary personas: Organization owner, sales/marketing operator, platform administrator.
- User jobs: Create a workspace, launch a lead-generation agent, collect structured leads, evaluate upgrade path to advisory agents.
- Key contexts of use: First product visit, setup call, internal pilot, staging demo.

## Information Architecture

- Primary navigation: Brand, Launch workspace, Lead preview, outcome metrics.
- Core routes/screens: Current single-page app; future routes for dashboard, agents, leads, billing, settings.
- Content hierarchy: Offer and proof first, setup workflow second, lead preview third.

## Design Principles

- Principle 1: Start with the buyer outcome, not the database model.
- Principle 2: Make the application feel operational, not like a placeholder form.
- Tradeoffs: Keep a go-to-market surface while exposing real MVP controls on the first screen.

## Visual Language

- Color: Balanced dark ink, bright green action, blue trust accents, warm amber highlights used sparingly.
- Typography: System sans-serif, strong product headline, compact operational labels.
- Spacing/layout rhythm: Dense but breathable SaaS layout with clear groups and no nested cards.
- Shape/radius/elevation: 8px maximum radius, restrained shadows, bordered panels for forms and repeated proof items.
- Motion: None for now.
- Imagery/iconography: Product-style conversation and lead pipeline preview instead of decorative illustration.

## Components

- Existing components to reuse: Workspace setup form, lead capture form, success/error states.
- New/changed components: GTM hero, proof metrics, product preview, launch checklist.
- Variants and states: Loading, success, error, disabled buttons.
- Token/component ownership: Plain CSS in `frontend/src/styles.css`.

## Accessibility

- Target standard: WCAG AA intent for contrast, labels, form semantics, status/alert regions.
- Keyboard/focus behavior: Native form controls and buttons remain keyboard accessible.
- Contrast/readability: Dark text on light surfaces, white text on dark hero, avoid low-contrast muted copy.
- Screen-reader semantics: Keep labeled forms, section labels, `role=status`, `role=alert`.
- Reduced motion and sensory considerations: No required animation.

## Responsive Behavior

- Supported breakpoints/devices: Desktop and mobile web.
- Layout adaptations: Two-column desktop, single-column mobile, forms collapse to one column.
- Touch/hover differences: Controls have stable sizes and no hover-only workflow.

## Interaction States

- Loading: Button text changes and button disables.
- Empty: Forms start blank with specific labels and supporting copy.
- Error: Red alert panel with concise fix-oriented message.
- Success: Blue/green summary panel with created workspace/lead details.
- Disabled: Lower opacity and progress cursor.
- Offline/slow network: Error message from failed request.

## Content Voice

- Tone: Confident, concise, business-first.
- Terminology: Organization, workspace, lead agent, structured leads, fixed monthly plans, advisory upgrade.
- Microcopy rules: Say what happens next; avoid describing internal infrastructure to customers.

## Implementation Constraints

- Framework/styling system: React, Vite, TypeScript, plain CSS.
- Design-token constraints: No external design system yet; keep color/radius/spacing centralized in CSS.
- Performance constraints: Static frontend served by Node service on VM 106, backend API on VM 107.
- Compatibility constraints: Node `>=22.13 <23`; same-origin `/api` through frontend proxy.
- Test/screenshot expectations: Run unit tests, E2E, smoke test, and inspect desktop/mobile screenshots after major UI changes.

## Open Questions

- [ ] Final custom domain and production brand URL / owner: Laurent / impacts public copy and canonical links.
- [ ] Final pricing numbers and plan limits / owner: Laurent / impacts GTM pricing section.
- [ ] Logo and visual identity assets / owner: Laurent / impacts brand polish.
