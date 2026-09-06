export const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Series", href: "/series" },
  { label: "Films", href: "/films" },
  { label: "New & Popular", href: "/new-popular" },
  { label: "My List", href: "/my-list" },
  { label: "Browse by Languages", href: "/browse/languages" },
] as const;

export const PROFILE_IMAGE = "https://i.pravatar.cc/80?img=12";

export function artworkUrl(id: string, crop = "w=900&h=506") {
  if (id.startsWith("http")) return id;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&${crop}&q=85`;
}
