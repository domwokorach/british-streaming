import { ok, parseBody, route } from "@/lib/auth/http";
import { registerSchema } from "@/lib/auth/schemas";
import { register } from "@/lib/auth/service";

export const POST = route(async (request, ctx) => {
  const { fullName, email, password } = await parseBody(request, registerSchema);
  await register({ fullName, email, password }, ctx);
  // Same answer whether or not the email already had an account.
  return ok({ status: "verification_sent" }, { status: 201 });
});
