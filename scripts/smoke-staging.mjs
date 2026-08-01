const baseUrl = process.env.STAGING_BASE_URL;

if (!baseUrl) {
  console.error("STAGING_BASE_URL is required, for example https://staging.example.com");
  process.exit(1);
}

const root = normalizeBaseUrl(baseUrl);
const leadEmail = `smoke+${Date.now()}@example.invalid`;

await checkHealth(`${root}/health`, "frontend");
await checkHealth(`${root}/api/health`, "backend");
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
