/** Single source of truth for public-facing branding. Identifiers (JWT issuer, service names, env keys) are deliberately not derived from this. */
export const BRAND = {
  name: "British Streaming",
  tagline: "Stream Films, Series and Live TV",
  description: "A cinematic streaming experience.",
  backgroundColor: "#101116",
  themeColor: "#101116",
} as const;
