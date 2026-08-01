import { defineConfig, devices } from "@playwright/test";

const backendPort = 4100;
const frontendPort = 4173;
const e2eDatabasePath = `${process.cwd()}/.e2e/adviceconnect-${process.pid}-${Date.now()}.sqlite`;

export default defineConfig({
  testDir: "./e2e",
  outputDir: ".e2e/test-results",
  globalTeardown: "./e2e/global-teardown.ts",
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    trace: "retain-on-failure"
  },
  reporter: [["list"], ["html", { outputFolder: ".e2e/playwright-report", open: "never" }]],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      command:
        `NODE_NO_WARNINGS=1 NODE_ENV=test HOST=127.0.0.1 PORT=4100 DATABASE_PATH=${e2eDatabasePath} ENABLE_DEV_LEAD_LIST=true CORS_ORIGIN=http://127.0.0.1:4173 npm --workspace backend run dev:e2e`,
      url: `http://127.0.0.1:${backendPort}/health`,
      reuseExistingServer: false,
      timeout: 30_000
    },
    {
      command:
        "VITE_BACKEND_PROXY_TARGET=http://127.0.0.1:4100 npm --workspace frontend run dev:e2e",
      url: `http://127.0.0.1:${frontendPort}/health`,
      reuseExistingServer: false,
      timeout: 30_000
    }
  ]
});
