import { readFileSync } from "node:fs";

const healthPath = new URL("../frontend/dist/health", import.meta.url);
const bundleDir = new URL("../frontend/dist/", import.meta.url);

const health = JSON.parse(readFileSync(healthPath, "utf8"));
if (health.status !== "ok" || health.service !== "adviceconnect-frontend") {
  throw new Error("frontend/dist/health does not match the frontend health contract.");
}

const privatePattern =
  /10\.60\.|10\.50\.|192\.168\.|20\.220\.|uipath-local-web-canada|127\.0\.0\.1:4000/;
const filesToCheck = ["index.html"];
const assetsPath = new URL("assets/", bundleDir);

try {
  const { readdirSync } = await import("node:fs");
  for (const fileName of readdirSync(assetsPath)) {
    if (fileName.endsWith(".js") || fileName.endsWith(".css")) {
      filesToCheck.push(`assets/${fileName}`);
    }
  }
} catch {
  // No assets directory means there is nothing extra to scan.
}

for (const fileName of filesToCheck) {
  const contents = readFileSync(new URL(fileName, bundleDir), "utf8");
  if (privatePattern.test(contents)) {
    throw new Error(`frontend build contains a private or infrastructure-specific address: ${fileName}`);
  }
}

console.info("frontend build health and browser-bundle safety verified");
