import { NextResponse } from "next/server";
import { getGoogleAuthUrl, googleConfigured } from "@/lib/google";
import { config } from "@/lib/config";

export async function GET() {
  if (!googleConfigured) {
    return NextResponse.redirect(`${config.appUrl}/login?error=google_not_configured`);
  }
  return NextResponse.redirect(getGoogleAuthUrl("login"));
}
