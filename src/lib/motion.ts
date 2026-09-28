/** Shared motion tokens so animation timings stay consistent across the app. */
export const DURATION = {
  micro: 0.14,
  button: 0.18,
  menu: 0.19,
  card: 0.22,
  modal: 0.26,
  carousel: 0.38,
  hero: 0.7,
  page: 0.32,
} as const;

export const EASE = {
  out: [0.22, 1, 0.36, 1] as const,
  in: [0.4, 0, 1, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

/** Standard "appear" transition used for menus, panels, tooltips, and expanding content. */
export const fadeUp = {
  initial: { opacity: 0, y: 6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 6, scale: 0.98 },
};
