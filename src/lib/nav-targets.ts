/** Primary-navigation destination -> the stable id of the content section that click should reveal. */
export const NAV_SCROLL_TARGETS: Record<string, string> = {
  "/": "home-content",
  "/series": "series-content",
  "/films": "films-content",
  "/new-popular": "popular-content",
  "/my-list": "my-list-content",
  "/browse/languages": "languages-content",
};

/**
 * Targets add no offset of their own: `html { scroll-padding-top }` in globals.css already clears the fixed header and the
 * notch for every scroll-into-view and anchor jump, and adding a `scroll-margin-top` here would stack on top of it.
 */
export const NAV_SCROLL_MARGIN_CLASS = "scroll-mt-0 outline-none";

export const targetIdFor = (pathname: string) => NAV_SCROLL_TARGETS[pathname.replace(/\/$/, "") || "/"] ?? null;
