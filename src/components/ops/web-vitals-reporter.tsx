"use client";

import { useReportWebVitals } from "next/web-vitals";

/** Ships Core Web Vitals to /api/telemetry; sendBeacon survives page unload. */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify({ type: "vital", name: metric.name, value: metric.value });
    if (!navigator.sendBeacon?.("/api/telemetry", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/telemetry", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  });
  return null;
}
