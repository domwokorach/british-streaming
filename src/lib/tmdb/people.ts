import { tmdbFetch } from "./client";
import type { TmdbPerson } from "./types";

export const getPersonDetails = (id: number) =>
  tmdbFetch<TmdbPerson>(`/person/${id}?append_to_response=combined_credits`, 3600);
