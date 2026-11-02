import type { Address } from "@/lib/address";

/** Geoapify is the optional location service. Without GEOAPIFY_API_KEY every places route answers 501 and the UI degrades to manual entry. */
const BASE = "https://api.geoapify.com/v1/geocode";

export const placesApiKey = () => process.env.GEOAPIFY_API_KEY || null;

interface GeoapifyResult {
  formatted?: string;
  address_line1?: string;
  housenumber?: string;
  street?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  county?: string;
  postcode?: string;
  country?: string;
}

export interface PlaceSuggestion { label: string; address: Address }

function toAddress(r: GeoapifyResult): Address {
  const street = [r.housenumber, r.street].filter(Boolean).join(" ") || r.address_line1 || "";
  return {
    street,
    city: r.city ?? r.town ?? r.village ?? "",
    region: r.state ?? r.county ?? "",
    postalCode: r.postcode ?? "",
    country: r.country ?? "",
  };
}

async function lookup(path: string, params: Record<string, string>): Promise<GeoapifyResult[]> {
  const key = placesApiKey();
  if (!key) return [];
  const url = new URL(`${BASE}/${path}`);
  Object.entries({ ...params, format: "json", apiKey: key }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
  if (!res.ok) throw new Error(`Places lookup failed (${res.status})`);
  const body = (await res.json()) as { results?: GeoapifyResult[] };
  return body.results ?? [];
}

export async function autocompleteAddress(query: string): Promise<PlaceSuggestion[]> {
  const results = await lookup("autocomplete", { text: query, limit: "5" });
  return results.map((r) => ({ label: r.formatted ?? r.address_line1 ?? "", address: toAddress(r) })).filter((s) => s.label);
}

export async function reverseGeocode(lat: number, lon: number): Promise<Address | null> {
  const [first] = await lookup("reverse", { lat: String(lat), lon: String(lon) });
  return first ? toAddress(first) : null;
}
