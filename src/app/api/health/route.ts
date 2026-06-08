import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/health — vérifie la connexion DB et l'existence des tables. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const users = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      database: "connected",
      usersTableReachable: true,
      userCount: users,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        database: "unreachable",
        hint:
          "Vérifie DATABASE_URL sur Vercel et exécute `npx prisma migrate deploy` sur la base.",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 503 },
    );
  }
}
