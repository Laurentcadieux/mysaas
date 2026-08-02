import { expect, test } from "@playwright/test";

test("renders the reset Hello World site and health checks", async ({ page, request }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Hello World" })).toBeVisible();

  const backendHealth = await request.get("http://127.0.0.1:4100/health");
  await expect(backendHealth).toBeOK();
  await expect(await backendHealth.json()).toEqual({
    status: "ok",
    service: "adviceconnect-backend"
  });

  const frontendHealth = await request.get("http://127.0.0.1:4173/health");
  await expect(frontendHealth).toBeOK();
  await expect(await frontendHealth.json()).toEqual({
    status: "ok",
    service: "adviceconnect-frontend"
  });
});
