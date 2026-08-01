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
