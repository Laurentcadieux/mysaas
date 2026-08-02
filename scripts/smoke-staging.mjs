const baseUrl = process.env.STAGING_BASE_URL;

if (!baseUrl) {
  console.error("STAGING_BASE_URL is required, for example https://staging.example.com");
  process.exit(1);
}

const root = normalizeBaseUrl(baseUrl);

await checkPage(root);
await checkHealth(`${root}/health`, "frontend");
await checkHealth(`${root}/api/health`, "backend");

console.info(`Hello World staging smoke checks passed for ${root}`);

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

async function checkPage(url) {
  const response = await fetch(url, { headers: { accept: "text/html" } });
  if (!response.ok) {
    throw new Error(`page check failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  if (!html.includes("Hello World") && !html.includes("/assets/")) {
    throw new Error("page check did not return the Hello World frontend shell");
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
