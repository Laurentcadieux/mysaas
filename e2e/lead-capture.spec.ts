import { expect, test } from "@playwright/test";

test("submits a synthetic lead through the UI and verifies backend persistence", async ({
  page,
  request
}) => {
  await page.goto("/");

  await page.getByRole("textbox", { name: "First name" }).fill("Ava");
  await page.getByRole("textbox", { name: "Last name" }).fill("Smith");
  await page.getByRole("textbox", { name: "Email" }).fill("AVA@EXAMPLE.COM");
  await page.getByRole("textbox", { name: "Phone" }).fill("555-0100");
  await page.getByRole("textbox", { name: "Company" }).fill("Example Co");
  await page.getByRole("textbox", { name: "Service interest" }).fill("Lead generation");
  await page.getByRole("textbox", { name: "Budget" }).fill("Under 5k");
  await page.getByRole("textbox", { name: "Timeline" }).fill("This quarter");
  await page.getByLabel("Preferred contact").selectOption("either");
  await page
    .getByRole("textbox", { name: "Business challenge" })
    .fill("Need better qualified website leads");
  await page.getByLabel(/consent/i).check();

  await page.getByRole("button", { name: "Submit lead" }).click();

  await expect(page.getByRole("status")).toContainText("Lead captured");

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

  const list = await request.get("http://127.0.0.1:4100/api/leads");
  await expect(list).toBeOK();
  const body = await list.json();

  expect(body.leads[0]).toMatchObject({
    firstName: "Ava",
    lastName: "Smith",
    email: "ava@example.com",
    company: "Example Co",
    preferredContactMethod: "either",
    businessChallenge: "Need better qualified website leads",
    status: "new",
    qualificationLevel: "unreviewed",
    urgency: "unknown",
    purchaseIntent: "unknown"
  });
});
