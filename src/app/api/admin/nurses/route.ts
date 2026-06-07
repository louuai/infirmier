import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError, NotFoundError } from "@/lib/errors";
import { ok } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { z } from "zod";

/** GET /api/admin/nurses - infirmiers à vérifier (ou tous). */
export async function GET(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const status = req.nextUrl.searchParams.get("status");
    const nurses = await prisma.nurseProfile.findMany({
      where: status
        ? { verificationStatus: status as "PENDING" | "APPROVED" | "REJECTED" }
        : undefined,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        documents: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return ok({ nurses });
  } catch (err) {
    return handleApiError(err);
  }
}

const verifySchema = z.object({
  nurseId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
});

/** PATCH /api/admin/nurses - valide ou refuse les documents d'un infirmier. */
export async function PATCH(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const { nurseId, decision } = verifySchema.parse(await req.json());

    const nurse = await prisma.nurseProfile.findUnique({ where: { id: nurseId } });
    if (!nurse) throw new NotFoundError("Infirmier introuvable");

    const updated = await prisma.nurseProfile.update({
      where: { id: nurseId },
      data: {
        verificationStatus: decision,
        verifiedAt: decision === "APPROVED" ? new Date() : null,
        documents:
          decision === "APPROVED" ? { updateMany: { where: {}, data: { verified: true } } } : undefined,
      },
    });

    await notify({
      userId: nurse.userId,
      type: decision === "APPROVED" ? "DOCUMENT_VERIFIED" : "DOCUMENT_REJECTED",
      title:
        decision === "APPROVED"
          ? "Compte validé ✅"
          : "Documents refusés",
      message:
        decision === "APPROVED"
          ? "Votre profil est validé, vous pouvez recevoir des réservations."
          : "Vos documents ont été refusés. Merci de les soumettre à nouveau.",
    });

    return ok({ nurse: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
