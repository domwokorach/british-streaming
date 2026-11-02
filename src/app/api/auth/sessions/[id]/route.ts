import { ok, protectedRoute } from "@/lib/auth/http";
import { revokeOtherSession } from "@/lib/auth/service";

export const DELETE = protectedRoute(async (request, auth, ctx) => {
  const id = new URL(request.url).pathname.split("/").at(-1) ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return ok({ revoked: false });
  await revokeOtherSession(auth, id, ctx);
  return ok({ revoked: true });
});
