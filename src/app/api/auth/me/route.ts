import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/session";
import { handleApiError, UnauthorizedError } from "@/lib/errors";
import { ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw new UnauthorizedError();
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true, email: true, role: true, firstName: true, lastName: true, phone: true, avatarUrl: true,
        patientProfile: true,
        nurseProfile: { include: { services: { include: { service: true } } } },
      },
    });
    return ok({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
