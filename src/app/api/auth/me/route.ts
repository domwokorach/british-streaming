import { ok, protectedRoute } from "@/lib/auth/http";
import { toPublicUser } from "@/lib/auth/service";

export const GET = protectedRoute(async (_request, auth) => ok({ user: toPublicUser(auth.user) }));
