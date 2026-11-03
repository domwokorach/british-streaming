import { Clapperboard, FileQuestion, Lock, ServerCrash, Wrench, WifiOff, type LucideIcon } from "lucide-react";

export type ErrorVariant = "404" | "403" | "500" | "503" | "offline";

export interface ErrorConfig {
  /** Big numerals; null shows the hero icon instead (e.g. offline has no HTTP status). */
  code: string | null;
  heading: string;
  description: string;
  icon: LucideIcon;
  /** Tooltip / accessible label for the status badge. */
  badge: string;
  /** Whether a retry action makes sense (transient failures only). */
  retryable: boolean;
  /** Offer sign-in as the primary action (permission problems). */
  signIn: boolean;
  /** Offer the title search (only when the catalogue is plausibly reachable). */
  search: boolean;
}

export const ERROR_CONFIG: Record<ErrorVariant, ErrorConfig> = {
  "404": {
    code: "404",
    heading: "Page Not Found",
    description: "Looks like this scene doesn't exist. The page you're looking for may have been moved, removed, or is temporarily unavailable.",
    icon: FileQuestion,
    badge: "Error 404: page not found",
    retryable: false,
    signIn: false,
    search: true,
  },
  "403": {
    code: "403",
    heading: "Access Denied",
    description: "You don't have permission to view this page. Sign in with an account that has access, or head back to something you can watch.",
    icon: Lock,
    badge: "Error 403: access denied",
    retryable: false,
    signIn: true,
    search: false,
  },
  "500": {
    code: "500",
    heading: "Server Error",
    description: "Something went wrong on our side. It isn't you. Please try again in a moment.",
    icon: ServerCrash,
    badge: "Error 500: server error",
    retryable: true,
    signIn: false,
    search: false,
  },
  "503": {
    code: "503",
    heading: "Service Unavailable",
    description: "British Streaming is temporarily unavailable, usually for maintenance or heavy demand. Please try again shortly.",
    icon: Wrench,
    badge: "Error 503: service unavailable",
    retryable: true,
    signIn: false,
    search: false,
  },
  offline: {
    code: null,
    heading: "You're Offline",
    description: "We can't reach British Streaming right now. Check your Wi-Fi or mobile data connection, then try again.",
    icon: WifiOff,
    badge: "No network connection",
    retryable: true,
    signIn: false,
    search: false,
  },
};

export const BRAND_ICON = Clapperboard;
