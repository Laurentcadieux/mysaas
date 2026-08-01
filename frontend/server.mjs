import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:4000";
const distRoot = resolve(process.env.FRONTEND_DIST_PATH ?? "dist");

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (url.pathname === "/health") {
    response.writeHead(200, {
      "content-type": "application/json",
      "cache-control": "no-store"
    });
    response.end(JSON.stringify({ status: "ok", service: "adviceconnect-frontend" }));
    return;
  }

  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    await proxyToApi(request, response, url);
    return;
  }

  serveStatic(url.pathname, response);
});

server.listen(port, host, () => {
  console.info(`adviceconnect-frontend listening on http://${host}:${port}`);
});

function serveStatic(pathname, response) {
  const candidate = resolveStaticPath(pathname);
  const filePath = findFile(candidate) ?? join(distRoot, "index.html");

  response.writeHead(200, {
    "content-type": contentTypeFor(filePath)
  });
  createReadStream(filePath).pipe(response);
}

function resolveStaticPath(pathname) {
  const cleanPath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = resolve(join(distRoot, cleanPath));

  if (filePath !== distRoot && !filePath.startsWith(`${distRoot}${sep}`)) {
    return join(distRoot, "index.html");
  }

  return filePath;
}

function findFile(filePath) {
  try {
    const stats = statSync(filePath);
    if (stats.isFile()) {
      return filePath;
    }
    if (stats.isDirectory()) {
      const indexPath = join(filePath, "index.html");
      if (statSync(indexPath).isFile()) {
        return indexPath;
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

async function proxyToApi(request, response, url) {
  const target = new URL(`${url.pathname}${url.search}`, apiProxyTarget);

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: forwardedHeaders(request),
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request,
      duplex: "half"
    });

    response.writeHead(upstream.status, Object.fromEntries(upstream.headers));
    if (upstream.body) {
      for await (const chunk of upstream.body) {
        response.write(chunk);
      }
    }
    response.end();
  } catch {
    response.writeHead(502, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: { code: "BAD_GATEWAY", message: "API is unavailable." } }));
  }
}

function forwardedHeaders(request) {
  const headers = new Headers();
  const blockedHeaders = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade"
  ]);

  for (const [name, value] of Object.entries(request.headers)) {
    const headerName = name.toLowerCase();
    if (value === undefined || headerName === "host" || blockedHeaders.has(headerName)) {
      continue;
    }
    if (Array.isArray(value)) {
      headers.set(name, value.join(", "));
    } else {
      headers.set(name, value);
    }
  }

  return headers;
}

function contentTypeFor(filePath) {
  const types = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8"
  };

  return types[extname(filePath)] ?? "application/octet-stream";
}
