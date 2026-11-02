import { httpDuration, httpRequests, statusClass } from "./metrics";
import { log } from "./logger";

/**
 * Wraps a route handler: records request count/latency by route template (never
 * the raw URL, to keep label cardinality bounded), propagates `x-request-id`,
 * and emits one structured log line per request.
 */
export function withMetrics<A extends unknown[]>(route: string, handler: (request: Request, ...rest: A) => Promise<Response>) {
  return async (request: Request, ...rest: A): Promise<Response> => {
    const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
    const started = performance.now();
    let status = 500;
    try {
      const response = await handler(request, ...rest);
      status = response.status;
      response.headers.set("x-request-id", requestId);
      return response;
    } finally {
      const seconds = (performance.now() - started) / 1000;
      const labels = { route, method: request.method };
      httpRequests.inc({ ...labels, status: statusClass(status) });
      httpDuration.observe(labels, seconds);
      log(status >= 500 ? "error" : "info", "http_request", { requestId, route, method: request.method, status, durationMs: Math.round(seconds * 1000) });
    }
  };
}
