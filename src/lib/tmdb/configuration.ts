import { tmdbFetch } from "./client";
import type { TmdbConfiguration } from "./types";

/** Rarely changes upstream — cache for a full day. */
export const getConfiguration = () => tmdbFetch<TmdbConfiguration>("/configuration", 86400);
