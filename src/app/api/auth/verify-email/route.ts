import { ok, parseBody, route } from "@/lib/auth/http";
import { tokenOnlySchema } from "@/lib/auth/schemas";
import { verifyEmail } from "@/lib/auth/service";

export const POST = route(async (request, ctx) => {
  const { token } = await parseBody(request, tokenOnlySchema);
  await verifyEmail(token, ctx);
  return ok({ verified: true });
});
