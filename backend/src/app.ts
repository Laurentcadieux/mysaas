import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import type { AppConfig } from "./config.js";
import { createLeadFromInput, LeadValidationError, validateLeadPayload } from "./leadContract.js";
import type { LeadStore } from "./leadRepository.js";
import { requestLogger } from "./logger.js";

export function createApp(config: AppConfig, repository: LeadStore) {
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
