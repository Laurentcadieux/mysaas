import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import type { AppConfig } from "./config.js";
import {
  createAgentSetupFromInput,
  createCustomerRegistrationFromInput,
  createWorkspaceSetupFromInput,
  validateAgentSetupPayload,
  validateCustomerRegistrationPayload,
  validateWorkspaceSetupPayload
} from "./foundationContract.js";
import { createLeadFromInput, LeadValidationError, validateLeadPayload } from "./leadContract.js";
import type { ApplicationStore } from "./leadRepository.js";
import { requestLogger } from "./logger.js";

export function createApp(config: AppConfig, repository: ApplicationStore) {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(requestLogger);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "adviceconnect-backend" });
  });

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "adviceconnect-backend" });
  });

  app.post("/api/leads", (req, res) => {
    const input = validateLeadPayload(req.body);
    const lead = repository.createLead(createLeadFromInput(input));
    res.status(201).json({ lead });
  });

  app.post("/api/foundation/workspaces", (req, res) => {
    const input = validateWorkspaceSetupPayload(req.body);
    const setup = repository.createWorkspaceSetup(createWorkspaceSetupFromInput(input));
    res.status(201).json({ workspace: setup });
  });

  app.post("/api/customers/register", (req, res) => {
    const input = validateCustomerRegistrationPayload(req.body);
    const registration = repository.createCustomerRegistration(
      createCustomerRegistrationFromInput(input)
    );
    res.status(201).json({ customer: registration });
  });

  app.post("/api/organizations/:organizationId/agents", (req, res, next) => {
    try {
      const input = validateAgentSetupPayload(req.params.organizationId, req.body);
      const setup = repository.createAgentSetup(createAgentSetupFromInput(input));
      res.status(201).json({ setup });
    } catch (error) {
      if (error instanceof Error && error.message === "Organization not found.") {
        res.status(404).json({ error: { code: "NOT_FOUND", message: "Organization not found." } });
        return;
      }
      next(error);
    }
  });

  app.get("/api/admin/customers", (_req, res) => {
    res.status(200).json({ customers: repository.listCustomerSummaries() });
  });

  app.get("/api/foundation/workspaces/:organizationId", (req, res) => {
    const setup = repository.getWorkspaceSetup(req.params.organizationId);
    if (!setup) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Workspace not found." } });
      return;
    }

    res.status(200).json({ workspace: setup });
  });

  app.get("/api/leads", (_req, res) => {
    if (config.nodeEnv === "production" || !config.enableDevLeadList) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found." } });
      return;
    }

    res.status(200).json({ leads: repository.listLeads() });
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    if (error instanceof LeadValidationError) {
      res.status(400).json(error.toResponse());
      return;
    }

    if (error instanceof SyntaxError && "body" in error) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Lead submission is invalid.",
          fields: { body: "Request body must be valid JSON." }
        }
      });
      return;
    }

    if (isPayloadTooLargeError(error)) {
      res.status(413).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Lead submission is invalid.",
          fields: { body: "Request body exceeds the configured size limit." }
        }
      });
      return;
    }

    next(error);
  };

  app.use(errorHandler);

  return app;
}

function isPayloadTooLargeError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    (error as { type?: unknown }).type === "entity.too.large"
  );
}
