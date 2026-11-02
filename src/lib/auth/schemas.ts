import { z } from "zod";
import { EMAIL_RE, normalizeEmail, PASSWORD_MAX_LENGTH } from "./password-policy";

const email = z.string().trim().max(254, "Email is too long.").refine((v) => EMAIL_RE.test(v), "Enter a valid email address.").transform(normalizeEmail);
const password = z.string().min(1, "Enter your password.").max(PASSWORD_MAX_LENGTH, "Password is too long.");
const token = z.string().min(20, "Invalid link.").max(200, "Invalid link.");

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your full name.").max(100, "Name is too long."),
  email,
  password,
  acceptTerms: z.literal(true, { error: "You must accept the Terms and Conditions." }),
});
export const signInSchema = z.object({ email, password, remember: z.boolean().optional().default(false) });
export const emailOnlySchema = z.object({ email });
export const resetSchema = z.object({ token, password });
export const tokenOnlySchema = z.object({ token });
