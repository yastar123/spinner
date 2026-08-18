import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

// Launch Express server in background
import "./express-server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// Proxy client request to local Express server running on port 3001
async function proxyToExpress(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const targetUrl = `http://127.0.0.1:3001${url.pathname}${url.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey === "connection" ||
      lowerKey === "keep-alive" ||
      lowerKey === "transfer-encoding" ||
      lowerKey === "content-length" ||
      lowerKey === "host"
    ) {
      return;
    }
    headers.set(key, value);
  });
  headers.set("host", "127.0.0.1:3001");

  let body: ArrayBuffer | null = null;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    body = await request.clone().arrayBuffer();
  }

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      // @ts-expect-error duplex property is required for standard node fetch body streaming
      duplex: body ? "half" : undefined,
    });
    return res;
  } catch (err) {
    console.error("Express proxy error:", err);
    return new Response(JSON.stringify({ error: "Backend Express server currently unreachable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        return await proxyToExpress(request);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
