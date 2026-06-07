import type {
  Booking,
  NurseProfile,
  Payment,
  Review,
  User,
} from "@prisma/client";

export type SafeUser = Omit<User, "passwordHash">;

export type NurseWithUser = NurseProfile & {
  user: SafeUser;
  distanceKm?: number;
};

export type BookingWithRelations = Booking & {
  nurse: NurseProfile & { user: SafeUser };
  patient: SafeUser;
  payment: Payment | null;
  review: Review | null;
};

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, string[]>;
}
