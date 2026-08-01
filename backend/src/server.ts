import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { LeadRepository } from "./leadRepository.js";

const config = loadConfig();
const repository = new LeadRepository(config.databasePath);
const app = createApp(config, repository);
const server = createServer(app);

server.listen(config.port, config.host, () => {
  console.info(`adviceconnect-backend listening on http://${config.host}:${config.port}`);
});

function shutdown() {
  server.close(() => {
    repository.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
