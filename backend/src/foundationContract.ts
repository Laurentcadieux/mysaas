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

export interface Subscription {
  id: string;
  organizationId: string;
  planCode: "lead-starter";
  status: "trialing";
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
  status: "draft";
  createdAt: string;
}

export interface WorkspaceSetup {
  organization: Organization;
  owner: User;
  membership: Membership;
  subscription: Subscription;
  project: Project;
  agent: Agent;
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
