import { useState } from "react";
import {
  createWorkspaceSetup,
  submitLead,
  type LeadSubmission,
  type WorkspaceSetupResponse,
  type WorkspaceSetupSubmission
} from "./api.js";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; leadId: string }
  | { status: "error"; message: string };

type WorkspaceState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; workspace: WorkspaceSetupResponse["workspace"] }
  | { status: "error"; message: string };

const initialLead: LeadSubmission = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  serviceInterest: "",
  businessChallenge: "",
  budget: "",
  timeline: "",
  preferredContactMethod: "email",
  consentToFollowUp: false,
  source: "website-form"
};

const initialWorkspace: WorkspaceSetupSubmission = {
  organizationName: "",
  website: "",
  ownerName: "",
  ownerEmail: "",
  projectName: "",
  agentName: "",
  objective: ""
};

export function App() {
  const [lead, setLead] = useState<LeadSubmission>(initialLead);
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [workspace, setWorkspace] = useState<WorkspaceSetupSubmission>(initialWorkspace);
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({ status: "idle" });

  const isSubmitting = state.status === "submitting";
  const isCreatingWorkspace = workspaceState.status === "submitting";

  function updateLead<K extends keyof LeadSubmission>(field: K, value: LeadSubmission[K]) {
    setLead((current) => ({ ...current, [field]: value }));
  }

  function updateWorkspace<K extends keyof WorkspaceSetupSubmission>(
    field: K,
    value: WorkspaceSetupSubmission[K]
  ) {
    setWorkspace((current) => ({ ...current, [field]: value }));
  }

  async function handleWorkspaceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreatingWorkspace) {
      return;
    }

    if (
      !workspace.organizationName.trim() ||
      !workspace.ownerName.trim() ||
      !workspace.ownerEmail.trim() ||
      !workspace.projectName.trim() ||
      !workspace.agentName.trim() ||
      !workspace.objective.trim()
    ) {
      setWorkspaceState({
        status: "error",
        message: "Organization, owner, project, agent, and objective are required."
      });
      return;
    }

    setWorkspaceState({ status: "submitting" });
    try {
      const response = await createWorkspaceSetup(workspace);
      setWorkspaceState({ status: "success", workspace: response.workspace });
    } catch (error) {
      setWorkspaceState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not create the workspace right now. Please try again."
      });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (!lead.firstName.trim() || !lead.email.trim() || !lead.businessChallenge.trim()) {
      setState({ status: "error", message: "Name, email, and business challenge are required." });
      return;
    }

    if (!lead.consentToFollowUp) {
      setState({ status: "error", message: "Consent is required before we can follow up." });
      return;
    }

    setState({ status: "submitting" });
    try {
      const response = await submitLead(lead);
      setState({ status: "success", leadId: response.lead.id });
      setLead(initialLead);
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not submit the lead right now. Please try again."
      });
    }
  }

  return (
    <main className="app-shell">
      <section className="product-panel" aria-labelledby="page-title">
        <nav className="topline" aria-label="Product">
          <strong>AdviceConnect</strong>
          <span>Private SaaS pilot</span>
        </nav>
        <p className="eyebrow">Lead agents for service businesses</p>
        <h1 id="page-title">Launch a website agent that turns conversations into qualified leads.</h1>
        <p className="lede">
          Create the workspace, publish the first lead-generation agent, and route every
          conversation into structured sales data.
        </p>
        <div className="hero-actions" aria-label="Primary actions">
          <a href="#workspace-setup">Launch workspace</a>
          <a href="#lead-preview">Preview lead flow</a>
        </div>
        <div className="metric-strip" aria-label="Product proof points">
          <span>
            <strong>14-day</strong>
            pilot-ready trial
          </span>
          <span>
            <strong>Fixed</strong>
            monthly plans
          </span>
          <span>
            <strong>Private</strong>
            backend routing
          </span>
        </div>
        <div className="phase-list" aria-label="Build phases">
          <span>Foundation</span>
          <span>Agent builder</span>
          <span>Publishing</span>
          <span>Payload processing</span>
        </div>
        <div className="conversation-preview" aria-label="Conversation preview">
          <p>Visitor asks about services, budget, and timing.</p>
          <p>AdviceConnect captures urgency, intent, contact details, and next action.</p>
          <p>Sales team gets a structured lead instead of a raw chat transcript.</p>
        </div>
      </section>

      <section className="workspace-column" aria-label="Application setup">
        <div className="launch-header">
          <p className="section-kicker">Go to market setup</p>
          <h2>Turn the first customer into a working workspace.</h2>
          <p>
            This creates the owner, organization, starter subscription, launch project, and first
            lead agent in one path.
          </p>
        </div>

        <form
          id="workspace-setup"
          className="workspace-form"
          onSubmit={handleWorkspaceSubmit}
        >
          <div>
            <p className="section-kicker">Step 1</p>
            <h3>Workspace foundation</h3>
          </div>

          <div className="form-grid">
            <label>
              Organization
              <input
                required
                value={workspace.organizationName}
                onChange={(event) => updateWorkspace("organizationName", event.target.value)}
                autoComplete="organization"
              />
            </label>
            <label>
              Website
              <input
                value={workspace.website}
                onChange={(event) => updateWorkspace("website", event.target.value)}
                autoComplete="url"
              />
            </label>
            <label>
              Owner name
              <input
                required
                value={workspace.ownerName}
                onChange={(event) => updateWorkspace("ownerName", event.target.value)}
                autoComplete="name"
              />
            </label>
            <label>
              Owner email
              <input
                required
                type="email"
                value={workspace.ownerEmail}
                onChange={(event) => updateWorkspace("ownerEmail", event.target.value)}
                autoComplete="email"
              />
            </label>
            <label>
              Project
              <input
                required
                value={workspace.projectName}
                onChange={(event) => updateWorkspace("projectName", event.target.value)}
              />
            </label>
            <label>
              Lead agent
              <input
                required
                value={workspace.agentName}
                onChange={(event) => updateWorkspace("agentName", event.target.value)}
              />
            </label>
          </div>

          <label>
            Agent objective
            <textarea
              required
              rows={4}
              value={workspace.objective}
              onChange={(event) => updateWorkspace("objective", event.target.value)}
            />
          </label>

          <button type="submit" disabled={isCreatingWorkspace}>
            {isCreatingWorkspace ? "Creating..." : "Create workspace"}
          </button>

          {workspaceState.status === "success" ? (
            <div role="status" className="workspace-summary">
              <strong>{workspaceState.workspace.organization.name}</strong>
              <span>Owner: {workspaceState.workspace.owner.email}</span>
              <span>Plan: {workspaceState.workspace.subscription.planCode}</span>
              <span>Project: {workspaceState.workspace.project.name}</span>
              <span>Agent: {workspaceState.workspace.agent.name}</span>
            </div>
          ) : null}
          {workspaceState.status === "error" ? (
            <p role="alert" className="error">
              {workspaceState.message}
            </p>
          ) : null}
        </form>

      <form
        id="lead-preview"
        className="lead-form"
        onSubmit={handleSubmit}
        aria-label="Lead capture form"
      >
        <div>
          <p className="section-kicker">Step 2</p>
          <h3>Preview the structured lead intake</h3>
        </div>
        <div className="form-grid">
          <label>
            First name
            <input
              required
              value={lead.firstName}
              onChange={(event) => updateLead("firstName", event.target.value)}
              autoComplete="given-name"
            />
          </label>
          <label>
            Last name
            <input
              value={lead.lastName}
              onChange={(event) => updateLead("lastName", event.target.value)}
              autoComplete="family-name"
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={lead.email}
              onChange={(event) => updateLead("email", event.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            Phone
            <input
              value={lead.phone}
              onChange={(event) => updateLead("phone", event.target.value)}
              autoComplete="tel"
            />
          </label>
          <label>
            Company
            <input
              value={lead.company}
              onChange={(event) => updateLead("company", event.target.value)}
              autoComplete="organization"
            />
          </label>
          <label>
            Service interest
            <input
              value={lead.serviceInterest}
              onChange={(event) => updateLead("serviceInterest", event.target.value)}
            />
          </label>
          <label>
            Budget
            <input value={lead.budget} onChange={(event) => updateLead("budget", event.target.value)} />
          </label>
          <label>
            Timeline
            <input
              value={lead.timeline}
              onChange={(event) => updateLead("timeline", event.target.value)}
            />
          </label>
        </div>

        <label>
          Preferred contact
          <select
            value={lead.preferredContactMethod}
            onChange={(event) =>
              updateLead(
                "preferredContactMethod",
                event.target.value as LeadSubmission["preferredContactMethod"]
              )
            }
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="either">Either</option>
          </select>
        </label>

        <label>
          Business challenge
          <textarea
            required
            rows={5}
            value={lead.businessChallenge}
            onChange={(event) => updateLead("businessChallenge", event.target.value)}
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={lead.consentToFollowUp}
            onChange={(event) => updateLead("consentToFollowUp", event.target.checked)}
          />
          I consent to being contacted about this request.
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit lead"}
        </button>

        {state.status === "success" ? (
          <p role="status" className="success">
            Lead captured. Reference {state.leadId}.
          </p>
        ) : null}
        {state.status === "error" ? (
          <p role="alert" className="error">
            {state.message}
          </p>
        ) : null}
      </form>
      </section>
    </main>
  );
}
