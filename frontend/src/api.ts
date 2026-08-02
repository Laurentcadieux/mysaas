export interface LeadSubmission {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  serviceInterest: string;
  businessChallenge: string;
  budget: string;
  timeline: string;
  preferredContactMethod: "email" | "phone" | "either";
  consentToFollowUp: boolean;
  source: string;
}

export interface LeadResponse {
  lead: {
    id: string;
    firstName: string;
    email: string;
    status: string;
    createdAt: string;
  };
}

export interface WorkspaceSetupSubmission {
  organizationName: string;
  website: string;
  ownerName: string;
  ownerEmail: string;
  projectName: string;
  agentName: string;
  objective: string;
}

export interface WorkspaceSetupResponse {
  workspace: {
    organization: {
      id: string;
      name: string;
      website: string;
      createdAt: string;
    };
    owner: {
      id: string;
      fullName: string;
      email: string;
      createdAt: string;
    };
    subscription: {
      id: string;
      planCode: PlanCode;
      status: SubscriptionStatus;
      currentPeriodEnd: string;
    };
    project: {
      id: string;
      name: string;
      objective: string;
      status: string;
    };
    agent: {
      id: string;
      name: string;
      type: string;
      status: string;
    };
  };
}

export type CustomerRegistrationSubmission = Pick<
  WorkspaceSetupSubmission,
  "organizationName" | "website" | "ownerName" | "ownerEmail"
> & {
  planCode: PlanCode;
};

export interface CustomerRegistrationResponse {
  customer: Pick<WorkspaceSetupResponse["workspace"], "organization" | "owner" | "subscription">;
}

export interface AgentSetupSubmission {
  projectName: string;
  agentName: string;
  greeting: string;
  instructions: string;
  qualificationQuestions: string;
}

export interface AgentSetupResponse {
  setup: Pick<WorkspaceSetupResponse["workspace"], "project" | "agent">;
}

export interface CustomerSummary {
  organizationId: string;
  organizationName: string;
  website: string;
  ownerName: string;
  ownerEmail: string;
  planCode: PlanCode;
  planName: string;
  monthlyPriceCents: number;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string;
  projectCount: number;
  agentCount: number;
  createdAt: string;
}

export type PlanCode = "lead-starter" | "lead-professional" | "advice-professional";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export interface Plan {
  code: PlanCode;
  name: string;
  monthlyPriceCents: number;
  includedAgents: number;
  includedTeamMembers: number;
  monthlyConversations: number;
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
  }
}

interface RuntimeEnv {
  DEV?: boolean;
  VITE_API_BASE_URL?: string;
}

export function resolveApiBaseUrl(env: RuntimeEnv): string {
  if (!env.DEV) {
    return "";
  }

  return env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") ?? "";
}

const configuredBaseUrl = import.meta.env.DEV
  ? resolveApiBaseUrl({
      DEV: true,
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL
    })
  : "";

export function getApiBaseUrl() {
  return configuredBaseUrl;
}

export async function submitLead(payload: LeadSubmission): Promise<LeadResponse> {
  const response = await fetch(`${configuredBaseUrl}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message =
      body?.error?.message ?? "We could not submit the lead right now. Please try again.";
    throw new ApiError(message);
  }

  return body as LeadResponse;
}

export async function createWorkspaceSetup(
  payload: WorkspaceSetupSubmission
): Promise<WorkspaceSetupResponse> {
  const response = await fetch(`${configuredBaseUrl}/api/foundation/workspaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message =
      body?.error?.message ?? "We could not create the workspace right now. Please try again.";
    throw new ApiError(message);
  }

  return body as WorkspaceSetupResponse;
}

export async function registerCustomer(
  payload: CustomerRegistrationSubmission
): Promise<CustomerRegistrationResponse> {
  const response = await fetch(`${configuredBaseUrl}/api/customers/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message =
      body?.error?.message ?? "We could not register the customer right now. Please try again.";
    throw new ApiError(message);
  }

  return body as CustomerRegistrationResponse;
}

export async function createAgentSetup(
  organizationId: string,
  payload: AgentSetupSubmission
): Promise<AgentSetupResponse> {
  const response = await fetch(`${configuredBaseUrl}/api/organizations/${organizationId}/agents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message =
      body?.error?.message ?? "We could not create the agent right now. Please try again.";
    throw new ApiError(message);
  }

  return body as AgentSetupResponse;
}

export async function listCustomers(): Promise<{ customers: CustomerSummary[] }> {
  const response = await fetch(`${configuredBaseUrl}/api/admin/customers`);
  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message =
      body?.error?.message ?? "We could not load customers right now. Please try again.";
    throw new ApiError(message);
  }

  return body as { customers: CustomerSummary[] };
}

export async function listPlans(): Promise<{ plans: Plan[] }> {
  const response = await fetch(`${configuredBaseUrl}/api/plans`);
  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message = body?.error?.message ?? "We could not load plans right now. Please try again.";
    throw new ApiError(message);
  }

  return body as { plans: Plan[] };
}

export async function updateSubscription(
  organizationId: string,
  payload: { planCode: PlanCode; status: SubscriptionStatus }
): Promise<CustomerRegistrationResponse["customer"]["subscription"]> {
  const response = await fetch(`${configuredBaseUrl}/api/admin/subscriptions/${organizationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    const message =
      body?.error?.message ?? "We could not update the subscription right now. Please try again.";
    throw new ApiError(message);
  }

  return body.subscription as CustomerRegistrationResponse["customer"]["subscription"];
}
