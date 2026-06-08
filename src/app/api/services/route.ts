import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, requireRole } from "@/lib/session";
import { serviceSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/errors";
import { created, ok } from "@/lib/api";

/** GET /api/services — liste publique (actifs). Admin + ?all=1 → tous. */
export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get("all") === "1";
    let includeInactive = false;
    if (all) {
      const s = await getSessionFromRequest(req);
      includeInactive = s?.role === "ADMIN";
    }
    const services = await prisma.service.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { name: "asc" },
    });
    return ok({ services });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/services — admin crée un service. */
export async function POST(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const input = serviceSchema.parse(await req.json());
    const service = await prisma.service.create({ data: input });
    return created({ service });
  } catch (err) {
    return handleApiError(err);
  }
}
