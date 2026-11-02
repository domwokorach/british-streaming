import { ok, protectedRoute } from "@/lib/auth/http";
import { getStore } from "@/lib/auth/store";

export const GET = protectedRoute(async (_request, auth) => {
  const sessions = await getStore().listActiveSessions(auth.user.id);
  return ok({
    sessions: sessions.map((s) => ({ id: s.id, current: s.id === auth.session.id, userAgent: s.userAgent, ip: s.ip, createdAt: s.createdAt, lastUsedAt: s.lastUsedAt })),
  });
});
