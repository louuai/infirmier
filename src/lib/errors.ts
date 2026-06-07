import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "./logger";

/** Erreur applicative avec code HTTP. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Non authentifié") {
    super(401, message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Accès refusé") {
    super(403, message, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable") {
    super(404, message, "NOT_FOUND");
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Requête invalide") {
    super(400, message, "BAD_REQUEST");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflit") {
    super(409, message, "CONFLICT");
  }
}

/** Convertit n'importe quelle erreur en réponse JSON propre. */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Données invalides",
        code: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    );
  }

  logger.error({ err: error }, "Erreur serveur non gérée");
  return NextResponse.json(
    { error: "Erreur interne du serveur", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
