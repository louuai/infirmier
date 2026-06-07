import { z } from "zod";

// ===================== Auth =====================
export const registerSchema = z
  .object({
    email: z.string().email("Email invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/[A-Z]/, "Au moins une majuscule")
      .regex(/[0-9]/, "Au moins un chiffre"),
    firstName: z.string().min(2, "Prénom requis"),
    lastName: z.string().min(2, "Nom requis"),
    phone: z
      .string()
      .regex(/^(\+216)?[0-9]{8}$/, "Numéro tunisien invalide")
      .optional(),
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
  specialties: z.array(z.string()).optional(),
  yearsOfExperience: z.number().int().min(0).max(60).optional(),
  pricePerVisit: z.number().min(0).optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  interventionRadiusKm: z.number().min(1).max(100).optional(),
  isAvailable: z.boolean().optional(),
});

export const availabilitySchema = z.object({
  availabilities: z.array(
    z.object({
      dayOfWeek: z.enum([
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ]),
      startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:MM"),
      endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format HH:MM"),
    }),
  ),
});

// ===================== Recherche infirmiers =====================
export const searchNursesSchema = z.object({
  city: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(1).max(100).default(20),
  specialty: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

// ===================== Réservations =====================
export const createBookingSchema = z.object({
  nurseId: z.string().min(1),
  scheduledAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: "La date doit être dans le futur",
  }),
  serviceType: z.string().min(2),
  notes: z.string().max(500).optional(),
  address: z.string().min(3, "Adresse requise"),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateBookingStatusSchema = z.object({
  action: z.enum(["accept", "refuse", "start", "complete"]),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(300).optional(),
});

// ===================== Avis =====================
export const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
