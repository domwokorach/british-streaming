export const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Series", href: "/series" },
  { label: "Films", href: "/films" },
  { label: "New & Popular", href: "/new-popular" },
  { label: "My List", href: "/my-list" },
  { label: "Browse by Languages", href: "/browse/languages" },
] as const;

/** Category pages shown in the secondary bar under the main nav. */
export const CATEGORY_ITEMS = [
  { label: "Films", href: "/films" },
  { label: "Series", href: "/series" },
  { label: "New & Popular", href: "/new-popular" },
  { label: "Browse by Languages", href: "/browse/languages" },
] as const;

export const PROFILE_IMAGE = "https://i.pravatar.cc/80?img=12";

/** Destinations for the mobile bottom tab bar (kept to five for thumb reach). */
export const BOTTOM_NAV_ITEMS = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Series", href: "/series", icon: "tv" },
  { label: "Films", href: "/films", icon: "film" },
  { label: "New", href: "/new-popular", icon: "flame" },
  { label: "My List", href: "/my-list", icon: "bookmark" },
] as const;
