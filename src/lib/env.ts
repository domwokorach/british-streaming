import "server-only";

function requiredPublic(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
  const value = process.env[name];
  if (!value || value.includes("YOUR_")) throw new Error(`${name} is not configured. Set it in .env.local.`);
  return value;
}

function required(name: "TMDB_API_READ_TOKEN" | "SUPABASE_SECRET_KEY") {
  const value = process.env[name];
  if (!value || value.includes("YOUR_")) throw new Error(`${name} is not configured. Set it in .env.local.`);
  return value;
}

// Fail fast, at import time, if the app's non-secret required configuration is missing —
// never logs the value itself, only that the variable is absent.
// `next build` imports every route module to collect page data, often on a CI host that has no runtime secrets, and these
// values are only read on the server at request time (never inlined into browser code). So the check is skipped for that
// one phase and still runs when the server starts and serves requests.
if (process.env.NEXT_PHASE !== "phase-production-build") {
  requiredPublic("NEXT_PUBLIC_SUPABASE_URL");
  requiredPublic("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

export const env = {
  tmdbBaseUrl: process.env.TMDB_API_BASE_URL ?? "https://api.themoviedb.org/3",
  tmdbRegion: process.env.TMDB_REGION ?? "GB",
  tmdbLanguage: process.env.TMDB_LANGUAGE ?? "en-GB",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  /** Thrown lazily (only when actually called) so pages that don't need TMDB/Supabase writes still render. */
  get tmdbReadToken() { return required("TMDB_API_READ_TOKEN"); },
  get supabaseSecretKey() { return required("SUPABASE_SECRET_KEY"); },
};
