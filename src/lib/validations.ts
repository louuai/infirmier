import { z } from "zod";

// ===================== Auth =====================
export const registerSchema = z
  .object({
    email: z.string().email("Email invalide"),
    password: z
      .string()
      .min(8, "Au moins 8 caractères")
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[0-9]/, "Au moins un chiffre"),
    firstName: z.string().min(2, "Prénom requis"),
    lastName: z.string().min(2, "Nom requis"),
    phone: z.string().regex(/^(\+216)?[0-9]{8}$/, "Numéro tunisien invalide").optional(),
    role: z.enum(["PATIENT", "NURSE"]).default("PATIENT"),
  })
  .strict();

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

// ===================== Profils =====================
export const patientProfileSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  dateOfBirth: z.coerce.date().optional(),
});

export const nurseProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  yearsOfExperience: z.number().int().min(0).max(60).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  interventionRadiusKm: z.number().min(1).max(100).optional(),
  availability: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]).optional(),
  serviceIds: z.array(z.string()).optional(),
});

export const nurseLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ===================== Recherche =====================
export const searchNursesSchema = z.object({
  serviceSlug: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

// ===================== Services (admin) =====================
export const serviceSchema = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "slug en minuscules-tirets"),
  name: z.string().min(2),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  active: z.boolean().default(true),
  icon: z.string().optional(),
});
export const serviceUpdateSchema = serviceSchema.partial();

// ===================== Réservations =====================
export const createBookingSchema = z.object({
  nurseId: z.string().min(1),
  serviceId: z.string().min(1),
  scheduledAt: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
  address: z.string().min(3, "Adresse requise"),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // Coordonnées invité (si pas connecté)
  guestName: z.string().min(2).optional(),
  guestPhone: z.string().min(6).optional(),
  guestEmail: z.string().email().optional(),
});

export const updateBookingStatusSchema = z.object({
  action: z.enum(["accept", "refuse", "en_route", "arrived", "start", "complete"]),
});

export const cancelBookingSchema = z.object({ reason: z.string().max(300).optional() });

// ===================== Avis =====================
export const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
