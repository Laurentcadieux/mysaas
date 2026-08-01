export interface AppConfig {
  nodeEnv: string;
  host: string;
  port: number;
  databasePath: string;
  corsOrigin: string;
  bodyLimit: string;
  enableDevLeadList: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV ?? "development";
  const corsOrigin = env.CORS_ORIGIN ?? "http://127.0.0.1:5173";

  if (nodeEnv === "production" && corsOrigin === "*") {
    throw new Error("CORS_ORIGIN cannot be wildcard in production.");
  }

  return {
    nodeEnv,
    host: env.HOST ?? "127.0.0.1",
    port: Number.parseInt(env.PORT ?? "4000", 10),
    databasePath: env.DATABASE_PATH ?? "./data/adviceconnect.sqlite",
    corsOrigin,
    bodyLimit: env.BODY_LIMIT ?? "64kb",
    enableDevLeadList: env.ENABLE_DEV_LEAD_LIST === "true"
  };
}
