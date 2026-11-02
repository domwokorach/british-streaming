import { ok, parseBody, route } from "@/lib/auth/http";
import { emailOnlySchema } from "@/lib/auth/schemas";
import { forgotPassword } from "@/lib/auth/service";

export const POST = route(async (request, ctx) => {
  const { email } = await parseBody(request, emailOnlySchema);
  await forgotPassword(email, ctx);
  return ok({ message: "If an account exists for that email, a reset link is on its way." }, { status: 202 });
});
