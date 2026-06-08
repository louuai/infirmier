import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/errors";
import { created, ok } from "@/lib/api";
import { z } from "zod";

const docSchema = z.object({
  type: z.enum(["DIPLOMA", "CIN"]),
  fileUrl: z.string().url("Lien invalide"),
});

/** POST /api/nurses/me/documents — l'infirmier soumet un diplôme ou une CIN. */
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(req, "NURSE");
    const input = docSchema.parse(await req.json());
    const nurse = await prisma.nurseProfile.findUnique({ where: { userId: session.sub } });
    if (!nurse) throw new Error("Profil introuvable");

    const doc = await prisma.nurseDocument.create({
      data: { nurseId: nurse.id, type: input.type, fileUrl: input.fileUrl },
    });
    // repasser en attente de validation à chaque nouveau dépôt
    await prisma.nurseProfile.update({ where: { id: nurse.id }, data: { verificationStatus: "PENDING" } });
    return created({ document: doc });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/nurses/me/documents?id=... */
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireRole(req, "NURSE");
    const id = req.nextUrl.searchParams.get("id");
    if (!id) throw new Error("id requis");
    const nurse = await prisma.nurseProfile.findUnique({ where: { userId: session.sub } });
    await prisma.nurseDocument.deleteMany({ where: { id, nurseId: nurse?.id } });
    return ok({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
