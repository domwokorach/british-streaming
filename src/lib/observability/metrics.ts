/**
 * Minimal in-process Prometheus registry (text exposition format 0.0.4).
 * Dependency-free on purpose: the standalone container stays small and the
 * output is easy to unit test. State is per Node process, which matches one
 * Prometheus scrape target per container.
 */
type Labels = Record<string, string>;

const SERVICE = process.env.SERVICE_NAME ?? "worldstreaming-web";

const key = (labels: Labels) => Object.keys(labels).sort().map((k) => `${k}="${escape(labels[k])}"`).join(",");
const escape = (v: string) => v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');

class Counter {
  private values = new Map<string, number>();
  constructor(readonly name: string, readonly help: string) {}
  inc(labels: Labels, by = 1) {
    const k = key(labels);
    this.values.set(k, (this.values.get(k) ?? 0) + by);
  }
  render() {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} counter`];
    for (const [k, v] of this.values) lines.push(`${this.name}{${k}} ${v}`);
    return lines;
  }
}

class Histogram {
  private series = new Map<string, { buckets: number[]; sum: number; count: number }>();
  constructor(readonly name: string, readonly help: string, readonly bounds: number[]) {}
  observe(labels: Labels, value: number) {
    const k = key(labels);
    const s = this.series.get(k) ?? { buckets: this.bounds.map(() => 0), sum: 0, count: 0 };
    this.bounds.forEach((b, i) => { if (value <= b) s.buckets[i] += 1; });
    s.sum += value;
    s.count += 1;
    this.series.set(k, s);
  }
  render() {
    const lines = [`# HELP ${this.name} ${this.help}`, `# TYPE ${this.name} histogram`];
    for (const [k, s] of this.series) {
      const sep = k ? "," : "";
      this.bounds.forEach((b, i) => lines.push(`${this.name}_bucket{${k}${sep}le="${b}"} ${s.buckets[i]}`));
      lines.push(`${this.name}_bucket{${k}${sep}le="+Inf"} ${s.count}`, `${this.name}_sum{${k}} ${s.sum}`, `${this.name}_count{${k}} ${s.count}`);
    }
    return lines;
  }
}

/** Bucket bounds in seconds; 0.3 is the p95 latency SLO threshold so it must stay a bucket edge. */
const LATENCY_BUCKETS = [0.025, 0.05, 0.1, 0.2, 0.3, 0.5, 1, 2.5, 5];

export const httpRequests = new Counter("http_requests_total", "HTTP requests handled, by route, method and status class.");
export const httpDuration = new Histogram("http_request_duration_seconds", "HTTP request latency in seconds.", LATENCY_BUCKETS);
export const webVitals = new Histogram("web_vitals_value", "Core Web Vitals reported by browsers (LCP/INP/FCP/TTFB in ms, CLS unitless).", [0.1, 0.25, 100, 200, 500, 1000, 2500, 4000]);
export const playerEvents = new Counter("player_events_total", "Playback events reported by clients (start, buffer, error).");
export const playerStartup = new Histogram("player_startup_seconds", "Time from play press to first frame.", [0.5, 1, 2, 3, 5, 10]);

export function renderMetrics(): string {
  const mem = process.memoryUsage();
  const proc = [
    "# HELP process_resident_memory_bytes Resident memory size in bytes.",
    "# TYPE process_resident_memory_bytes gauge",
    `process_resident_memory_bytes ${mem.rss}`,
    "# HELP process_uptime_seconds Process uptime.",
    "# TYPE process_uptime_seconds gauge",
    `process_uptime_seconds ${Math.round(process.uptime())}`,
    "# HELP app_info Build information.",
    "# TYPE app_info gauge",
    `app_info{service="${SERVICE}",version="${process.env.APP_VERSION ?? "dev"}"} 1`,
  ];
  return [...httpRequests.render(), ...httpDuration.render(), ...webVitals.render(), ...playerEvents.render(), ...playerStartup.render(), ...proc].join("\n") + "\n";
}

export const statusClass = (status: number) => `${Math.floor(status / 100)}xx`;
