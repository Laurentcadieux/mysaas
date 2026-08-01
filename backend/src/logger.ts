import type { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = performance.now();
  res.on("finish", () => {
    const durationMs = Math.round(performance.now() - startedAt);
    console.info(`${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`);
  });
  next();
}
