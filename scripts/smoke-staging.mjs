const baseUrl = process.env.STAGING_BASE_URL;

if (!baseUrl) {
  console.error("STAGING_BASE_URL is required, for example https://staging.example.com");
  process.exit(1);
}

const root = normalizeBaseUrl(baseUrl);
const leadEmail = `smoke+${Date.now()}@example.invalid`;

await checkHealth(`${root}/health`, "frontend");
await checkHealth(`${root}/api/health`, "backend");
await checkPlans(`${root}/api/plans`);
const organizationId = await registerCustomer(`${root}/api/customers/register`, leadEmail);
await activateSubscription(`${root}/api/admin/subscriptions/${organizationId}`);
await createAgent(`${root}/api/organizations/${organizationId}/agents`);
await checkManagement(`${root}/api/admin/customers`, organizationId);
await submitLead(`${root}/api/leads`, leadEmail);

console.info(`Staging smoke checks passed for ${root}`);

function normalizeBaseUrl(value) {
  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    console.error(`STAGING_BASE_URL is not a valid URL: ${value}`);
    process.exit(1);
  }
}

async function checkHealth(url, label) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json,text/plain,*/*"
    }
  });

  if (!response.ok) {
    throw new Error(`${label} health check failed: ${response.status} ${response.statusText}`);
  }
}

async function submitLead(url, email) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({
      firstName: "Staging",
      lastName: "Smoke",
      email,
      company: "MySaas Smoke Test",
      serviceInterest: "Lead capture staging validation",
      businessChallenge: "Validate staging lead capture routing after deployment.",
      preferredContactMethod: "email",
      consentToFollowUp: true,
      source: "staging-smoke"
    })
  });

  if (response.status !== 201) {
    const body = await response.text();
    throw new Error(`lead submission failed: ${response.status} ${response.statusText}\n${body}`);
  }

  const payload = await response.json();
  if (!payload.lead || payload.lead.email !== email) {
    throw new Error("lead submission response did not include the expected lead");
  }
}

async function registerCustomer(url, email) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({
      organizationName: "MySaas Smoke Test",
      website: "https://example.invalid",
      ownerName: "Staging Smoke",
      ownerEmail: email,
      planCode: "lead-professional"
    })
  });

  if (response.status !== 201) {
    const body = await response.text();
    throw new Error(`customer registration failed: ${response.status} ${response.statusText}\n${body}`);
  }

  const payload = await response.json();
  if (!payload.customer?.organization?.id) {
    throw new Error("registration response did not include the expected organization");
  }
  return payload.customer.organization.id;
}

async function checkPlans(url) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`plans check failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (!payload.plans?.some((plan) => plan.code === "lead-professional")) {
    throw new Error("plans check did not include the expected subscription plan");
  }
}

async function activateSubscription(url) {
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({ planCode: "lead-professional", status: "active" })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`subscription activation failed: ${response.status} ${response.statusText}\n${body}`);
  }
}

async function createAgent(url) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({
      projectName: "Smoke project",
      agentName: "Smoke lead agent",
      greeting: "Hi, I can help route your request.",
      instructions: "Ask for the visitor need, urgency, and best follow-up path.",
      qualificationQuestions: "What do you need?\nWhen do you need it?\nHow should the team follow up?"
    })
  });

  if (response.status !== 201) {
    const body = await response.text();
    throw new Error(`agent creation failed: ${response.status} ${response.statusText}\n${body}`);
  }
}

async function checkManagement(url, organizationId) {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`management check failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const customer = payload.customers?.find((item) => item.organizationId === organizationId);
  if (!customer || customer.agentCount < 1) {
    throw new Error("management check did not include the registered customer and agent");
  }
}
