import { NextResponse } from "next/server";

/** Réponse JSON succès standardisée. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}
