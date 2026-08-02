import { randomUUID } from "node:crypto";
import { LeadValidationError } from "./leadContract.js";

export interface WorkspaceSetupInput {
  organizationName: string;
  website: string;
  ownerName: string;
  ownerEmail: string;
  projectName: string;
  agentName: string;
  objective: string;
}

export interface CustomerRegistrationInput {
  organizationName: string;
  website: string;
  ownerName: string;
  ownerEmail: string;
  planCode: PlanCode;
}

export interface AgentSetupInput {
  organizationId: string;
  projectName: string;
  agentName: string;
  greeting: string;
  instructions: string;
  qualificationQuestions: string;
}

export interface Organization {
  id: string;
  name: string;
  website: string;
  createdAt: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: "owner";
  status: "active";
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

export interface Subscription {
  id: string;
  organizationId: string;
  planCode: PlanCode;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  objective: string;
  status: "draft";
  createdAt: string;
}

export interface Agent {
  id: string;
  organizationId: string;
  projectId: string;
  type: "lead-generation";
  name: string;
  objective: string;
  greeting: string;
  instructions: string;
  qualificationQuestions: string;
  status: "draft";
  createdAt: string;
}

export interface CustomerRegistration {
  organization: Organization;
  owner: User;
  membership: Membership;
  subscription: Subscription;
}

export interface AgentSetup {
  project: Project;
  agent: Agent;
}

export interface WorkspaceSetup {
  organization: Organization;
  owner: User;
  membership: Membership;
  subscription: Subscription;
  project: Project;
  agent: Agent;
}

export interface CustomerSummary {
  organizationId: string;
  organizationName: string;
  website: string;
  ownerName: string;
  ownerEmail: string;
  planCode: string;
  planName: string;
  monthlyPriceCents: number;
  subscriptionStatus: string;
  currentPeriodEnd: string;
  projectCount: number;
  agentCount: number;
  createdAt: string;
}

export interface SubscriptionUpdateInput {
  organizationId: string;
  planCode: PlanCode;
  status: SubscriptionStatus;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateWorkspaceSetupPayload(body: unknown): WorkspaceSetupInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new LeadValidationError({ body: "Request body must be an object." });
  }

  const payload = body as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const organizationName = readString(payload, "organizationName", 120, true);
  const website = readString(payload, "website", 240);
  const ownerName = readString(payload, "ownerName", 120, true);
  const ownerEmail = readString(payload, "ownerEmail", 254, true);
  const projectName = readString(payload, "projectName", 120, true);
  const agentName = readString(payload, "agentName", 120, true);
  const objective = readString(payload, "objective", 600, true);

  for (const [name, result] of Object.entries({
    organizationName,
    website,
    ownerName,
    ownerEmail,
    projectName,
    agentName,
    objective
  })) {
    if (result.error) {
      fields[name] = result.error;
    }
  }

  const normalizedOwnerEmail = ownerEmail.value.toLowerCase();
  if (!fields.ownerEmail && !emailPattern.test(normalizedOwnerEmail)) {
    fields.ownerEmail = "ownerEmail must be a valid email address.";
  }

  if (Object.keys(fields).length > 0) {
    throw new LeadValidationError(fields);
  }

  return {
    organizationName: organizationName.value,
    website: website.value,
    ownerName: ownerName.value,
    ownerEmail: normalizedOwnerEmail,
    projectName: projectName.value,
    agentName: agentName.value,
    objective: objective.value
  };
}

export function validateCustomerRegistrationPayload(body: unknown): CustomerRegistrationInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new LeadValidationError({ body: "Request body must be an object." });
  }

  const payload = body as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const organizationName = readString(payload, "organizationName", 120, true);
  const website = readString(payload, "website", 240);
  const ownerName = readString(payload, "ownerName", 120, true);
  const ownerEmail = readString(payload, "ownerEmail", 254, true);
  const planCode = readString(payload, "planCode", 80);

  for (const [name, result] of Object.entries({
    organizationName,
    website,
    ownerName,
    ownerEmail,
    planCode
  })) {
    if (result.error) {
      fields[name] = result.error;
    }
  }

  const normalizedOwnerEmail = ownerEmail.value.toLowerCase();
  if (!fields.ownerEmail && !emailPattern.test(normalizedOwnerEmail)) {
    fields.ownerEmail = "ownerEmail must be a valid email address.";
  }
  const normalizedPlanCode = normalizePlanCode(planCode.value || "lead-starter");
  if (!normalizedPlanCode) {
    fields.planCode = "planCode must be an available subscription plan.";
  }

  if (Object.keys(fields).length > 0) {
    throw new LeadValidationError(fields);
  }

  return {
    organizationName: organizationName.value,
    website: website.value,
    ownerName: ownerName.value,
    ownerEmail: normalizedOwnerEmail,
    planCode: normalizedPlanCode ?? "lead-starter"
  };
}

export function validateAgentSetupPayload(
  organizationId: string,
  body: unknown
): AgentSetupInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new LeadValidationError({ body: "Request body must be an object." });
  }

  const payload = body as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const projectName = readString(payload, "projectName", 120, true);
  const agentName = readString(payload, "agentName", 120, true);
  const greeting = readString(payload, "greeting", 240, true);
  const instructions = readString(payload, "instructions", 1200, true);
  const qualificationQuestions = readString(payload, "qualificationQuestions", 1200, true);

  for (const [name, result] of Object.entries({
    projectName,
    agentName,
    greeting,
    instructions,
    qualificationQuestions
  })) {
    if (result.error) {
      fields[name] = result.error;
    }
  }

  if (!organizationId.trim()) {
    fields.organizationId = "organizationId is required.";
  }

  if (Object.keys(fields).length > 0) {
    throw new LeadValidationError(fields);
  }

  return {
    organizationId: organizationId.trim(),
    projectName: projectName.value,
    agentName: agentName.value,
    greeting: greeting.value,
    instructions: instructions.value,
    qualificationQuestions: qualificationQuestions.value
  };
}

export function validateSubscriptionUpdatePayload(
  organizationId: string,
  body: unknown
): SubscriptionUpdateInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new LeadValidationError({ body: "Request body must be an object." });
  }

  const payload = body as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const planCode = readString(payload, "planCode", 80, true);
  const status = readString(payload, "status", 40, true);
  const normalizedPlanCode = normalizePlanCode(planCode.value);
  const normalizedStatus = normalizeSubscriptionStatus(status.value);

  if (!organizationId.trim()) {
    fields.organizationId = "organizationId is required.";
  }
  if (planCode.error) {
    fields.planCode = planCode.error;
  } else if (!normalizedPlanCode) {
    fields.planCode = "planCode must be an available subscription plan.";
  }
  if (status.error) {
    fields.status = status.error;
  } else if (!normalizedStatus) {
    fields.status = "status must be trialing, active, past_due, or canceled.";
  }

  if (Object.keys(fields).length > 0) {
    throw new LeadValidationError(fields);
  }

  return {
    organizationId: organizationId.trim(),
    planCode: normalizedPlanCode ?? "lead-starter",
    status: normalizedStatus ?? "trialing"
  };
}

export function createWorkspaceSetupFromInput(
  input: WorkspaceSetupInput,
  now = new Date()
): WorkspaceSetup {
  const timestamp = now.toISOString();
  const organizationId = randomUUID();
  const ownerId = randomUUID();
  const projectId = randomUUID();

  return {
    organization: {
      id: organizationId,
      name: input.organizationName,
      website: input.website,
      createdAt: timestamp
    },
    owner: {
      id: ownerId,
      fullName: input.ownerName,
      email: input.ownerEmail,
      createdAt: timestamp
    },
    membership: {
      id: randomUUID(),
      organizationId,
      userId: ownerId,
      role: "owner",
      status: "active",
      createdAt: timestamp
    },
    subscription: {
      id: randomUUID(),
      organizationId,
      planCode: "lead-starter",
      status: "trialing",
      currentPeriodStart: timestamp,
      currentPeriodEnd: addDays(now, 14).toISOString(),
      createdAt: timestamp
    },
    project: {
      id: projectId,
      organizationId,
      name: input.projectName,
      objective: input.objective,
      status: "draft",
      createdAt: timestamp
    },
    agent: {
      id: randomUUID(),
      organizationId,
      projectId,
      type: "lead-generation",
      name: input.agentName,
      objective: input.objective,
      greeting: "Hi, I can help capture your request and route it to the right team.",
      instructions: input.objective,
      qualificationQuestions: "What do you need help with?\nWhat is your timeline?\nWhat is the best way to follow up?",
      status: "draft",
      createdAt: timestamp
    }
  };
}

export function createCustomerRegistrationFromInput(
  input: CustomerRegistrationInput,
  now = new Date()
): CustomerRegistration {
  const timestamp = now.toISOString();
  const organizationId = randomUUID();
  const ownerId = randomUUID();

  return {
    organization: {
      id: organizationId,
      name: input.organizationName,
      website: input.website,
      createdAt: timestamp
    },
    owner: {
      id: ownerId,
      fullName: input.ownerName,
      email: input.ownerEmail,
      createdAt: timestamp
    },
    membership: {
      id: randomUUID(),
      organizationId,
      userId: ownerId,
      role: "owner",
      status: "active",
      createdAt: timestamp
    },
    subscription: {
      id: randomUUID(),
      organizationId,
      planCode: input.planCode,
      status: "trialing",
      currentPeriodStart: timestamp,
      currentPeriodEnd: addDays(now, 14).toISOString(),
      createdAt: timestamp
    }
  };
}

function normalizePlanCode(value: string): PlanCode | undefined {
  if (
    value === "lead-starter" ||
    value === "lead-professional" ||
    value === "advice-professional"
  ) {
    return value;
  }
  return undefined;
}

function normalizeSubscriptionStatus(value: string): SubscriptionStatus | undefined {
  if (value === "trialing" || value === "active" || value === "past_due" || value === "canceled") {
    return value;
  }
  return undefined;
}

export function createAgentSetupFromInput(input: AgentSetupInput, now = new Date()): AgentSetup {
  const timestamp = now.toISOString();
  const projectId = randomUUID();
  const objective = `${input.greeting}\n\n${input.instructions}`;

  return {
    project: {
      id: projectId,
      organizationId: input.organizationId,
      name: input.projectName,
      objective,
      status: "draft",
      createdAt: timestamp
    },
    agent: {
      id: randomUUID(),
      organizationId: input.organizationId,
      projectId,
      type: "lead-generation",
      name: input.agentName,
      objective,
      greeting: input.greeting,
      instructions: input.instructions,
      qualificationQuestions: input.qualificationQuestions,
      status: "draft",
      createdAt: timestamp
    }
  };
}

function readString(
  payload: Record<string, unknown>,
  field: string,
  maxLength: number,
  required = false
): { value: string; error?: string } {
  const raw = payload[field];

  if (raw === undefined) {
    if (required) {
      return { value: "", error: `${field} is required.` };
    }
    return { value: "" };
  }

  if (raw === null || typeof raw !== "string") {
    return { value: "", error: `${field} must be a string.` };
  }

  const value = raw.trim();
  if (required && value.length === 0) {
    return { value, error: `${field} is required.` };
  }
  if (value.length > maxLength) {
    return { value, error: `${field} must be ${maxLength} characters or fewer.` };
  }

  return { value };
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
