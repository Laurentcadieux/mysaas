import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import type { AppConfig } from "./config.js";
import { loadConfig } from "./config.js";
import { validateLeadPayload } from "./leadContract.js";
import { LeadRepository } from "./leadRepository.js";

const validLead = {
  firstName: " Ava ",
  lastName: " Smith ",
  email: " AVA@EXAMPLE.COM ",
  phone: " 555-0100 ",
  company: " Example Co ",
  serviceInterest: " Lead generation ",
  businessChallenge: " Need better qualified website leads ",
  budget: " Under 5k ",
  timeline: " This quarter ",
  preferredContactMethod: "either",
  consentToFollowUp: true,
  source: " website-form ",
  ignored: "not stored"
};

function makeHarness(overrides: Partial<AppConfig> = {}) {
  const dir = mkdtempSync(join(tmpdir(), "adviceconnect-test-"));
  const databasePath = join(dir, "test.sqlite");
  const config: AppConfig = {
    ...loadConfig({
      NODE_ENV: "test",
      DATABASE_PATH: databasePath,
      ENABLE_DEV_LEAD_LIST: "false"
    }),
    ...overrides,
    databasePath: overrides.databasePath ?? databasePath
  };
  const repository = new LeadRepository(config.databasePath);
  const app = createApp(config, repository);

  return {
    app,
    config,
    repository,
    cleanup() {
      repository.close();
      rmSync(dir, { recursive: true, force: true });
    }
  };
}

describe("lead contract", () => {
  it("normalizes known fields and ignores unknown fields", () => {
    const input = validateLeadPayload(validLead);

    expect(input).toMatchObject({
      firstName: "Ava",
      lastName: "Smith",
      email: "ava@example.com",
      businessChallenge: "Need better qualified website leads",
      preferredContactMethod: "either",
      consentToFollowUp: true
    });
    expect(input).not.toHaveProperty("ignored");
  });

  it("rejects required fields, consent failures, invalid types, and oversized strings", () => {
    expect(() =>
      validateLeadPayload({
        firstName: "",
        email: "bad-email",
        businessChallenge: "x".repeat(1001),
        consentToFollowUp: false,
        preferredContactMethod: "fax"
      })
    ).toThrowError("Lead submission is invalid.");
  });
});

describe("backend api", () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    vi.restoreAllMocks();
  });

  it("returns backend health", async () => {
    const harness = makeHarness();
    cleanup = harness.cleanup;

    const response = await request(harness.app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "adviceconnect-backend" });
  });

  it("creates a lead with normalized persisted data and default indicators", async () => {
    const harness = makeHarness({ enableDevLeadList: true });
    cleanup = harness.cleanup;

    const response = await request(harness.app).post("/api/leads").send(validLead);

    expect(response.status).toBe(201);
    expect(response.body.lead).toMatchObject({
      firstName: "Ava",
      email: "ava@example.com",
      status: "new",
      qualificationLevel: "unreviewed",
      urgency: "unknown",
      purchaseIntent: "unknown"
    });
    expect(response.body.lead.id).toEqual(expect.any(String));
    expect(response.body.lead.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const listResponse = await request(harness.app).get("/api/leads");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.leads[0].email).toBe("ava@example.com");
  });

  it("rejects invalid payloads with the documented error envelope", async () => {
    const harness = makeHarness();
    cleanup = harness.cleanup;

    const response = await request(harness.app).post("/api/leads").send({
      firstName: "Ava",
      email: "",
      businessChallenge: "",
      consentToFollowUp: false
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Lead submission is invalid."
    });
    expect(response.body.error.fields.email).toBeDefined();
    expect(response.body.error.fields.consentToFollowUp).toBeDefined();
  });

  it("rejects explicit null optional fields instead of defaulting them", async () => {
    const harness = makeHarness();
    cleanup = harness.cleanup;

    const response = await request(harness.app)
      .post("/api/leads")
      .send({
        ...validLead,
        phone: null,
        company: null,
        preferredContactMethod: null
      });

    expect(response.status).toBe(400);
    expect(response.body.error.fields).toMatchObject({
      phone: "phone must be a string.",
      company: "company must be a string.",
      preferredContactMethod: "preferredContactMethod must be email, phone, or either."
    });
  });

  it("rejects malformed JSON with a structured validation error", async () => {
    const harness = makeHarness();
    cleanup = harness.cleanup;

    const response = await request(harness.app)
      .post("/api/leads")
      .set("Content-Type", "application/json")
      .send('{"firstName":');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({
      code: "VALIDATION_ERROR",
      fields: { body: "Request body must be valid JSON." }
    });
  });

  it("rejects oversized HTTP request bodies", async () => {
    const harness = makeHarness({ bodyLimit: "1kb" });
    cleanup = harness.cleanup;

    const response = await request(harness.app)
      .post("/api/leads")
      .send({
        ...validLead,
        businessChallenge: "x".repeat(2000)
      });

    expect(response.status).toBe(413);
    expect(response.body.error).toMatchObject({
      code: "VALIDATION_ERROR",
      fields: { body: "Request body exceeds the configured size limit." }
    });
  });

  it("keeps lead listing disabled unless explicitly enabled outside production", async () => {
    const harness = makeHarness();
    cleanup = harness.cleanup;

    const response = await request(harness.app).get("/api/leads");
    expect(response.status).toBe(404);
  });

  it("lists multiple leads newest first when the development list is enabled", async () => {
    const harness = makeHarness({ enableDevLeadList: true });
    cleanup = harness.cleanup;

    harness.repository.createLead({
      id: "lead-old",
      ...validateLeadPayload({ ...validLead, email: "old@example.com" }),
      status: "new",
      qualificationLevel: "unreviewed",
      urgency: "unknown",
      purchaseIntent: "unknown",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z"
    });
    harness.repository.createLead({
      id: "lead-new",
      ...validateLeadPayload({ ...validLead, email: "new@example.com" }),
      status: "new",
      qualificationLevel: "unreviewed",
      urgency: "unknown",
      purchaseIntent: "unknown",
      createdAt: "2026-08-01T00:01:00.000Z",
      updatedAt: "2026-08-01T00:01:00.000Z"
    });

    const response = await request(harness.app).get("/api/leads");

    expect(response.status).toBe(200);
    expect(response.body.leads.map((lead: { id: string }) => lead.id)).toEqual([
      "lead-new",
      "lead-old"
    ]);
  });

  it("keeps lead listing disabled in production even when the dev flag is true", async () => {
    const harness = makeHarness({ nodeEnv: "production", enableDevLeadList: true });
    cleanup = harness.cleanup;

    const response = await request(harness.app).get("/api/leads");
    expect(response.status).toBe(404);
  });

  it("bootstraps schema version 1 and survives repository re-instantiation", () => {
    const harness = makeHarness();
    cleanup = harness.cleanup;
    const databasePath = harness.config.databasePath;

    expect(harness.repository.getSchemaVersion()).toBe(1);
    const created = harness.repository.createLead({
      id: "lead-test-1",
      ...validateLeadPayload(validLead),
      status: "new",
      qualificationLevel: "unreviewed",
      urgency: "unknown",
      purchaseIntent: "unknown",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z"
    });
    expect(created.id).toBe("lead-test-1");

    harness.repository.close();
    const reopened = new LeadRepository(databasePath);
    expect(reopened.getSchemaVersion()).toBe(1);
    expect(reopened.listLeads()[0].id).toBe("lead-test-1");
    reopened.close();
    cleanup = () => rmSync(join(databasePath, ".."), { recursive: true, force: true });
  });

  it("rejects wildcard CORS in production and sets the 64kb body limit default", () => {
    expect(() => loadConfig({ NODE_ENV: "production", CORS_ORIGIN: "*" })).toThrow(
      "CORS_ORIGIN cannot be wildcard in production."
    );
    expect(loadConfig({}).bodyLimit).toBe("64kb");
    expect(loadConfig({ CORS_ORIGIN: "http://localhost:5173" }).corsOrigin).toBe(
      "http://localhost:5173"
    );
  });

  it("returns the configured explicit CORS origin", async () => {
    const harness = makeHarness({ corsOrigin: "http://127.0.0.1:5173" });
    cleanup = harness.cleanup;

    const response = await request(harness.app)
      .get("/health")
      .set("Origin", "http://127.0.0.1:5173");

    expect(response.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:5173");
  });

  it("does not log lead payload fields", async () => {
    const harness = makeHarness();
    cleanup = harness.cleanup;
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    await request(harness.app).post("/api/leads").send(validLead);

    const logged = info.mock.calls.flat().join(" ");
    expect(logged).toContain("POST /api/leads");
    expect(logged).not.toContain("Ava");
    expect(logged).not.toContain("ava@example.com");
    expect(logged).not.toContain("Need better qualified");
  });
});
