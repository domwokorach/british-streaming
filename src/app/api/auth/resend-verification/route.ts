import { ok, parseBody, route } from "@/lib/auth/http";
import { emailOnlySchema } from "@/lib/auth/schemas";
import { resendVerification } from "@/lib/auth/service";

export const POST = route(async (request, ctx) => {
  const { email } = await parseBody(request, emailOnlySchema);
  await resendVerification(email, ctx);
  return ok({ message: "If that account needs verification, a new link is on its way." }, { status: 202 });
});
