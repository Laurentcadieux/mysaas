import { rmSync } from "node:fs";
import { join } from "node:path";

export default async function globalTeardown() {
  rmSync(join(process.cwd(), ".e2e"), { recursive: true, force: true });
}
