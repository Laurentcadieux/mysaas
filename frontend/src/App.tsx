import { useEffect, useState } from "react";
import {
  createAgentSetup,
  listCustomers,
  listPlans,
  registerCustomer,
  submitLead,
  updateSubscription,
  type AgentSetupSubmission,
  type CustomerRegistrationResponse,
  type CustomerRegistrationSubmission,
  type CustomerSummary,
  type LeadSubmission,
  type Plan,
  type PlanCode,
  type SubscriptionStatus
} from "./api.js";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; leadId: string }
  | { status: "error"; message: string };

type RegistrationState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; customer: CustomerRegistrationResponse["customer"] }
  | { status: "error"; message: string };

type AgentState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; agentName: string }
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

const initialRegistration: CustomerRegistrationSubmission = {
  organizationName: "",
  website: "",
  ownerName: "",
  ownerEmail: "",
  planCode: "lead-starter"
};

const initialAgent: AgentSetupSubmission = {
  projectName: "",
  agentName: "",
  greeting: "Hi, I can help understand your needs and route your request to the right person.",
  instructions:
    "Ask concise questions, capture contact details, identify urgency and purchase intent, then summarize the recommended next step.",
  qualificationQuestions:
    "What service are you looking for?\nWhat problem are you trying to solve?\nWhat timeline are you working with?\nWhat budget range should the team understand?"
};

export function App() {
  const [lead, setLead] = useState<LeadSubmission>(initialLead);
  const [leadState, setLeadState] = useState<SubmitState>({ status: "idle" });
  const [registration, setRegistration] =
    useState<CustomerRegistrationSubmission>(initialRegistration);
  const [registrationState, setRegistrationState] = useState<RegistrationState>({
    status: "idle"
  });
  const [agent, setAgent] = useState<AgentSetupSubmission>(initialAgent);
  const [agentState, setAgentState] = useState<AgentState>({ status: "idle" });
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [agentOrganizationId, setAgentOrganizationId] = useState("");

  const selectedOrganizationId =
    registrationState.status === "success"
      ? registrationState.customer.organization.id
      : agentOrganizationId || customers[0]?.organizationId;

  useEffect(() => {
    void refreshCustomers();
    void refreshPlans();
  }, []);

  useEffect(() => {
    if (!agentOrganizationId && customers[0]) {
      setAgentOrganizationId(customers[0].organizationId);
    }
  }, [agentOrganizationId, customers]);

  function updateLead<K extends keyof LeadSubmission>(field: K, value: LeadSubmission[K]) {
    setLead((current) => ({ ...current, [field]: value }));
  }

  function updateRegistration<K extends keyof CustomerRegistrationSubmission>(
    field: K,
    value: CustomerRegistrationSubmission[K]
  ) {
    setRegistration((current) => ({ ...current, [field]: value }));
  }

  function updateAgent<K extends keyof AgentSetupSubmission>(field: K, value: AgentSetupSubmission[K]) {
    setAgent((current) => ({ ...current, [field]: value }));
  }

  async function refreshCustomers() {
    try {
      const response = await listCustomers();
      setCustomers(response.customers);
    } catch {
      setCustomers([]);
    }
  }

  async function refreshPlans() {
    try {
      const response = await listPlans();
      setPlans(response.plans ?? []);
    } catch {
      setPlans([]);
    }
  }

  async function handleSubscriptionUpdate(
    organizationId: string,
    planCode: PlanCode,
    status: SubscriptionStatus
  ) {
    setSubscriptionMessage("");
    try {
      await updateSubscription(organizationId, { planCode, status });
      await refreshCustomers();
      setSubscriptionMessage("Subscription updated.");
    } catch (error) {
      setSubscriptionMessage(
        error instanceof Error ? error.message : "We could not update the subscription."
      );
    }
  }

  async function handleRegistrationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (registrationState.status === "submitting") {
      return;
    }

    if (
      !registration.organizationName.trim() ||
      !registration.ownerName.trim() ||
      !registration.ownerEmail.trim()
    ) {
      setRegistrationState({
        status: "error",
        message: "Organization, owner name, and owner email are required."
      });
      return;
    }

    setRegistrationState({ status: "submitting" });
    try {
      const response = await registerCustomer(registration);
      setRegistrationState({ status: "success", customer: response.customer });
      setAgentOrganizationId(response.customer.organization.id);
      await refreshCustomers();
    } catch (error) {
      setRegistrationState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not register the customer right now. Please try again."
      });
    }
  }

  async function handleAgentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (agentState.status === "submitting" || !selectedOrganizationId) {
      return;
    }

    if (
      !agent.projectName.trim() ||
      !agent.agentName.trim() ||
      !agent.greeting.trim() ||
      !agent.instructions.trim() ||
      !agent.qualificationQuestions.trim()
    ) {
      setAgentState({
        status: "error",
        message: "Project, agent name, greeting, instructions, and questions are required."
      });
      return;
    }

    setAgentState({ status: "submitting" });
    try {
      const response = await createAgentSetup(selectedOrganizationId, agent);
      setAgentState({ status: "success", agentName: response.setup.agent.name });
      await refreshCustomers();
    } catch (error) {
      setAgentState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not create the agent right now. Please try again."
      });
    }
  }

  async function handleLeadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (leadState.status === "submitting") {
      return;
    }

    if (!lead.firstName.trim() || !lead.email.trim() || !lead.businessChallenge.trim()) {
      setLeadState({
        status: "error",
        message: "Name, email, and business challenge are required."
      });
      return;
    }

    if (!lead.consentToFollowUp) {
      setLeadState({ status: "error", message: "Consent is required before we can follow up." });
      return;
    }

    setLeadState({ status: "submitting" });
    try {
      const response = await submitLead(lead);
      setLeadState({ status: "success", leadId: response.lead.id });
      setLead(initialLead);
    } catch (error) {
      setLeadState({
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
        <h1 id="page-title">Run AdviceConnect as a subscription SaaS.</h1>
        <p className="lede">
          Onboard paying customers, choose their plan, enforce agent limits, and manage billing
          status from the operator dashboard.
        </p>
        <div className="hero-actions" aria-label="Primary actions">
          <a href="#customer-registration">Register customer</a>
          <a href="#management">View management</a>
        </div>
        <div className="metric-strip" aria-label="Product proof points">
          <span>
            <strong>Step 1</strong>
            customer account + plan
          </span>
          <span>
            <strong>Step 2</strong>
            subscription-gated agent
          </span>
          <span>
            <strong>Step 3</strong>
            MRR visibility
          </span>
        </div>
        <div className="conversation-preview" aria-label="Conversation preview">
          <p>New customer registers their company, owner account, and subscription plan.</p>
          <p>Agent creation checks subscription status and the selected plan’s included agents.</p>
          <p>You see plan value, status, renewal date, and customer counts in management.</p>
        </div>
      </section>

      <section className="workspace-column" aria-label="Application setup">
        <div className="launch-header">
          <p className="section-kicker">Go to market operation</p>
          <h2>Onboard a customer, create their first agent, then manage the account.</h2>
          <p>
            This is now a subscription operating flow: plan first, agent limits second, admin
            billing control third.
          </p>
        </div>

        <form
          id="customer-registration"
          className="workspace-form"
          onSubmit={handleRegistrationSubmit}
        >
          <div>
            <p className="section-kicker">Register</p>
            <h3>New customer account</h3>
          </div>

          <div className="form-grid">
            <label>
              Organization
              <input
                required
                value={registration.organizationName}
                onChange={(event) => updateRegistration("organizationName", event.target.value)}
                autoComplete="organization"
              />
            </label>
            <label>
              Website
              <input
                value={registration.website}
                onChange={(event) => updateRegistration("website", event.target.value)}
                autoComplete="url"
              />
            </label>
            <label>
              Owner name
              <input
                required
                value={registration.ownerName}
                onChange={(event) => updateRegistration("ownerName", event.target.value)}
                autoComplete="name"
              />
            </label>
            <label>
              Owner email
              <input
                required
                type="email"
                value={registration.ownerEmail}
                onChange={(event) => updateRegistration("ownerEmail", event.target.value)}
                autoComplete="email"
              />
            </label>
            <label>
              Subscription plan
              <select
                value={registration.planCode}
                onChange={(event) =>
                  updateRegistration("planCode", event.target.value as PlanCode)
                }
              >
                {plans.length === 0 ? (
                  <option value="lead-starter">Lead Starter</option>
                ) : (
                  plans.map((plan) => (
                    <option key={plan.code} value={plan.code}>
                      {plan.name} - {formatCurrency(plan.monthlyPriceCents)}/mo
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>

          <button type="submit" disabled={registrationState.status === "submitting"}>
            {registrationState.status === "submitting" ? "Registering..." : "Register customer"}
          </button>

          {registrationState.status === "success" ? (
            <div role="status" className="workspace-summary">
              <strong>{registrationState.customer.organization.name}</strong>
              <span>Owner: {registrationState.customer.owner.email}</span>
              <span>Plan: {registrationState.customer.subscription.planCode}</span>
              <span>Status: {registrationState.customer.subscription.status}</span>
              <span>Ready for conversational lead agent setup.</span>
            </div>
          ) : null}
          {registrationState.status === "error" ? (
            <p role="alert" className="error">
              {registrationState.message}
            </p>
          ) : null}
        </form>

        <form className="workspace-form" onSubmit={handleAgentSubmit}>
          <div>
            <p className="section-kicker">Agent builder</p>
            <h3>First conversational lead agent</h3>
          </div>

          <div className="form-grid">
            <label>
              Customer
              <select
                value={selectedOrganizationId ?? ""}
                onChange={(event) => setAgentOrganizationId(event.target.value)}
                disabled={customers.length === 0 && registrationState.status !== "success"}
              >
                {registrationState.status === "success" ? (
                  <option value={registrationState.customer.organization.id}>
                    {registrationState.customer.organization.name}
                  </option>
                ) : null}
                {customers
                  .filter(
                    (customer) =>
                      registrationState.status !== "success" ||
                      customer.organizationId !== registrationState.customer.organization.id
                  )
                  .map((customer) => (
                    <option key={customer.organizationId} value={customer.organizationId}>
                      {customer.organizationName}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Project
              <input
                required
                value={agent.projectName}
                onChange={(event) => updateAgent("projectName", event.target.value)}
              />
            </label>
            <label>
              Lead agent
              <input
                required
                value={agent.agentName}
                onChange={(event) => updateAgent("agentName", event.target.value)}
              />
            </label>
          </div>

          <label>
            Greeting
            <textarea
              required
              rows={3}
              value={agent.greeting}
              onChange={(event) => updateAgent("greeting", event.target.value)}
            />
          </label>
          <label>
            Conversational instructions
            <textarea
              required
              rows={4}
              value={agent.instructions}
              onChange={(event) => updateAgent("instructions", event.target.value)}
            />
          </label>
          <label>
            Qualification questions
            <textarea
              required
              rows={5}
              value={agent.qualificationQuestions}
              onChange={(event) => updateAgent("qualificationQuestions", event.target.value)}
            />
          </label>

          <button type="submit" disabled={agentState.status === "submitting" || !selectedOrganizationId}>
            {agentState.status === "submitting" ? "Creating..." : "Create lead agent"}
          </button>

          {agentState.status === "success" ? (
            <p role="status" className="success">
              Agent created: {agentState.agentName}.
            </p>
          ) : null}
          {agentState.status === "error" ? (
            <p role="alert" className="error">
              {agentState.message}
            </p>
          ) : null}
        </form>

        <section id="management" className="management-panel" aria-labelledby="management-title">
          <div>
            <p className="section-kicker">Management</p>
            <h3 id="management-title">Subscription customers</h3>
          </div>
          <div className="revenue-strip" aria-label="Subscription totals">
            <span>
              <strong>{customers.length}</strong>
              customers
            </span>
            <span>
              <strong>{formatCurrency(calculateMrr(customers))}</strong>
              monthly recurring revenue
            </span>
            <span>
              <strong>{customers.filter((customer) => customer.subscriptionStatus === "active").length}</strong>
              active paid
            </span>
          </div>
          <div className="customer-list">
            {customers.length === 0 ? (
              <p>No customers registered yet.</p>
            ) : (
              customers.map((customer) => (
                <article key={customer.organizationId}>
                  <div>
                    <strong>{customer.organizationName}</strong>
                    <span>{customer.ownerEmail}</span>
                  </div>
                  <span>
                    {customer.planName} · {formatCurrency(customer.monthlyPriceCents)}/mo
                  </span>
                  <span>
                    {customer.agentCount} of {plans.find((plan) => plan.code === customer.planCode)?.includedAgents ?? "?"} agents
                  </span>
                  <span>Renews {formatDate(customer.currentPeriodEnd)}</span>
                  <label>
                    Plan
                    <select
                      value={customer.planCode}
                      onChange={(event) =>
                        void handleSubscriptionUpdate(
                          customer.organizationId,
                          event.target.value as PlanCode,
                          customer.subscriptionStatus
                        )
                      }
                    >
                      {plans.map((plan) => (
                        <option key={plan.code} value={plan.code}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Status
                    <select
                      value={customer.subscriptionStatus}
                      onChange={(event) =>
                        void handleSubscriptionUpdate(
                          customer.organizationId,
                          customer.planCode,
                          event.target.value as SubscriptionStatus
                        )
                      }
                    >
                      <option value="trialing">Trialing</option>
                      <option value="active">Active</option>
                      <option value="past_due">Past due</option>
                      <option value="canceled">Canceled</option>
                    </select>
                  </label>
                </article>
              ))
            )}
          </div>
          {subscriptionMessage ? <p role="status" className="success">{subscriptionMessage}</p> : null}
        </section>

        <form
          id="lead-preview"
          className="lead-form"
          onSubmit={handleLeadSubmit}
          aria-label="Lead capture form"
        >
          <div>
            <p className="section-kicker">Lead preview</p>
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
              <input
                value={lead.budget}
                onChange={(event) => updateLead("budget", event.target.value)}
              />
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

          <button type="submit" disabled={leadState.status === "submitting"}>
            {leadState.status === "submitting" ? "Submitting..." : "Submit lead"}
          </button>

          {leadState.status === "success" ? (
            <p role="status" className="success">
              Lead captured. Reference {leadState.leadId}.
            </p>
          ) : null}
          {leadState.status === "error" ? (
            <p role="alert" className="error">
              {leadState.message}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}

function calculateMrr(customers: CustomerSummary[]): number {
  return customers
    .filter((customer) => customer.subscriptionStatus === "active")
    .reduce((total, customer) => total + customer.monthlyPriceCents, 0);
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

function formatDate(value: string): string {
  if (!value) {
    return "not set";
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(value)
  );
}
