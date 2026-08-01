import { randomUUID } from "node:crypto";

export type PreferredContactMethod = "email" | "phone" | "either";

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  serviceInterest: string;
  businessChallenge: string;
  budget: string;
  timeline: string;
  preferredContactMethod: PreferredContactMethod;
  consentToFollowUp: true;
  source: string;
  status: "new";
  qualificationLevel: "unreviewed";
  urgency: "unknown";
  purchaseIntent: "unknown";
  createdAt: string;
  updatedAt: string;
}

export interface LeadInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  serviceInterest: string;
  businessChallenge: string;
  budget: string;
  timeline: string;
  preferredContactMethod: PreferredContactMethod;
  consentToFollowUp: true;
  source: string;
}

export interface ValidationErrorBody {
  error: {
    code: "VALIDATION_ERROR";
    message: "Lead submission is invalid.";
    fields: Record<string, string>;
  };
}

export class LeadValidationError extends Error {
  readonly fields: Record<string, string>;

  constructor(fields: Record<string, string>) {
    super("Lead submission is invalid.");
    this.fields = fields;
  }

  toResponse(): ValidationErrorBody {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "Lead submission is invalid.",
        fields: this.fields
      }
    };
  }
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const contactMethods: PreferredContactMethod[] = ["email", "phone", "either"];

function readString(
  payload: Record<string, unknown>,
  field: string,
  maxLength: number,
  required = false,
  defaultValue = ""
): { value: string; error?: string } {
  const raw = payload[field];

  if (raw === undefined) {
    if (required) {
      return { value: "", error: `${field} is required.` };
    }
    return { value: defaultValue };
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

export function validateLeadPayload(body: unknown): LeadInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new LeadValidationError({ body: "Request body must be an object." });
  }

  const payload = body as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const firstName = readString(payload, "firstName", 80, true);
  const lastName = readString(payload, "lastName", 80);
  const email = readString(payload, "email", 254, true);
  const phone = readString(payload, "phone", 40);
  const company = readString(payload, "company", 120);
  const serviceInterest = readString(payload, "serviceInterest", 160);
  const businessChallenge = readString(payload, "businessChallenge", 1000, true);
  const budget = readString(payload, "budget", 80);
  const timeline = readString(payload, "timeline", 80);
  const source = readString(payload, "source", 80, false, "website-form");

  for (const [name, result] of Object.entries({
    firstName,
    lastName,
    email,
    phone,
    company,
    serviceInterest,
    businessChallenge,
    budget,
    timeline,
    source
  })) {
    if (result.error) {
      fields[name] = result.error;
    }
  }

  const normalizedEmail = email.value.toLowerCase();
  if (!fields.email && !emailPattern.test(normalizedEmail)) {
    fields.email = "email must be a valid email address.";
  }

  const methodRaw =
    payload.preferredContactMethod === undefined ? "email" : payload.preferredContactMethod;
  const preferredContactMethod =
    typeof methodRaw === "string" ? methodRaw.trim().toLowerCase() : methodRaw;

  if (!contactMethods.includes(preferredContactMethod as PreferredContactMethod)) {
    fields.preferredContactMethod = "preferredContactMethod must be email, phone, or either.";
  }

  if (payload.consentToFollowUp !== true) {
    fields.consentToFollowUp = "consentToFollowUp must be true.";
  }

  if (Object.keys(fields).length > 0) {
    throw new LeadValidationError(fields);
  }

  return {
    firstName: firstName.value,
    lastName: lastName.value,
    email: normalizedEmail,
    phone: phone.value,
    company: company.value,
    serviceInterest: serviceInterest.value,
    businessChallenge: businessChallenge.value,
    budget: budget.value,
    timeline: timeline.value,
    preferredContactMethod: preferredContactMethod as PreferredContactMethod,
    consentToFollowUp: true,
    source: source.value || "website-form"
  };
}

export function createLeadFromInput(input: LeadInput, now = new Date()): Lead {
  const timestamp = now.toISOString();

  return {
    id: randomUUID(),
    ...input,
    status: "new",
    qualificationLevel: "unreviewed",
    urgency: "unknown",
    purchaseIntent: "unknown",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
