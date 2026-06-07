import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken, type JwtPayload } from "./auth";
import { ForbiddenError, UnauthorizedError } from "./errors";
import type { Role } from "@prisma/client";

/** Récupère la session depuis le cookie (Server Components / Route Handlers). */
export async function getSession(): Promise<JwtPayload | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Récupère la session depuis une requête (API routes avec header Bearer ou cookie). */
export async function getSessionFromRequest(
  req: NextRequest,
): Promise<JwtPayload | null> {
  const bearer = req.headers.get("authorization");
  const token = bearer?.startsWith("Bearer ")
    ? bearer.slice(7)
    : req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Exige une session valide, sinon lève UnauthorizedError. */
export async function requireSession(req: NextRequest): Promise<JwtPayload> {
  const session = await getSessionFromRequest(req);
  if (!session) throw new UnauthorizedError();
  return session;
}

/** Exige une session avec un des rôles autorisés. */
export async function requireRole(
  req: NextRequest,
  ...roles: Role[]
): Promise<JwtPayload> {
  const session = await requireSession(req);
  if (!roles.includes(session.role)) throw new ForbiddenError();
  return session;
}
