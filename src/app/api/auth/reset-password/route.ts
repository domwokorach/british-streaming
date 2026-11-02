import { ok, parseBody, route } from "@/lib/auth/http";
import { resetSchema } from "@/lib/auth/schemas";
import { resetPassword } from "@/lib/auth/service";

// Deliberately does NOT sign the user in: possessing a reset token proves mailbox access, not that they should get a session.
export const POST = route(async (request, ctx) => {
  await resetPassword(await parseBody(request, resetSchema), ctx);
  return ok({ reset: true });
});
