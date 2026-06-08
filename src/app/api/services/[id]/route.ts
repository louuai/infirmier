import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { serviceUpdateSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/errors";
import { ok } from "@/lib/api";

/** PATCH /api/services/[id] — admin modifie (tarif, activation...). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, "ADMIN");
    const { id } = await params;
    const input = serviceUpdateSchema.parse(await req.json());
    const service = await prisma.service.update({ where: { id }, data: input });
    return ok({ service });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/services/[id] — admin supprime. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(req, "ADMIN");
    const { id } = await params;
    await prisma.service.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
