import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireSession } from "@/lib/session";
import { handleApiError } from "@/lib/errors";

export const runtime = "nodejs";

/**
 * POST /api/upload — téléverse un fichier (caméra/scan) vers Vercel Blob.
 * Requiert BLOB_READ_WRITE_TOKEN (auto sur Vercel quand un store Blob est connecté).
 * Sans token : 501 → l'UI propose alors le mode "lien".
 */
export async function POST(req: NextRequest) {
  try {
    await requireSession(req);
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Upload de fichier non configuré (Vercel Blob). Utilisez l'option « Lien ».", code: "UPLOAD_DISABLED" },
        { status: 501 },
      );
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
    }
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const blob = await put(`documents/${Date.now()}-${safe}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ data: { url: blob.url } }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
