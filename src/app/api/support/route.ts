import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { handleApiError } from "@/lib/errors";
import { created } from "@/lib/api";
import { z } from "zod";

const schema = z.object({ subject: z.string().min(2).max(120), message: z.string().min(2).max(2000) });

/** POST /api/support — message direct vers l'admin (notifications admin). */
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(req);
    const { subject, message } = schema.parse(await req.json());
    const sender = await prisma.user.findUnique({ where: { id: session.sub }, select: { firstName: true, lastName: true, email: true, role: true } });
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });

    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "GENERIC" as const,
        title: `📩 ${subject}`,
        message: `${sender?.firstName} ${sender?.lastName} (${sender?.role}, ${sender?.email}) : ${message}`,
        metadata: { support: true, from: session.sub },
      })),
    });
    return created({ sent: true });
  } catch (err) {
    return handleApiError(err);
  }
}
