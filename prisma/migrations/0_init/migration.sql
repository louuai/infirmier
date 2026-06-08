-- ============================================================
--  Migration initiale v2 : Infirmier Tunis (workflow type Uber)
-- ============================================================

-- Enums
CREATE TYPE "Role" AS ENUM ('PATIENT', 'NURSE', 'ADMIN');
CREATE TYPE "NurseVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "NurseAvailability" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'REFUSED', 'AWAITING_PAYMENT', 'PAID', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "PaymentProvider" AS ENUM ('MOCK', 'FLOUCI', 'D17', 'CARD', 'KONNECT');
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'SETTLED');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID');
CREATE TYPE "InvoiceStatus" AS ENUM ('ISSUED', 'PAID', 'CANCELLED');
CREATE TYPE "NotificationType" AS ENUM ('REQUEST_RECEIVED', 'REQUEST_ACCEPTED', 'REQUEST_REFUSED', 'PAYMENT_RECEIVED', 'NURSE_EN_ROUTE', 'NURSE_ARRIVED', 'MISSION_COMPLETED', 'REVIEW_RECEIVED', 'DOCUMENT_VERIFIED', 'DOCUMENT_REJECTED', 'GENERIC');
CREATE TYPE "DocumentType" AS ENUM ('DIPLOMA', 'CIN');
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PATIENT',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- patient_profiles
CREATE TABLE "patient_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "dateOfBirth" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- nurse_profiles
CREATE TABLE "nurse_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 0,
    "city" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "interventionRadiusKm" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "lastSeenAt" TIMESTAMP(3),
    "availability" "NurseAvailability" NOT NULL DEFAULT 'OFFLINE',
    "verificationStatus" "NurseVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "nurse_profiles_pkey" PRIMARY KEY ("id")
);

-- nurse_documents
CREATE TABLE "nurse_documents" (
    "id" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nurse_documents_pkey" PRIMARY KEY ("id")
);

-- availabilities
CREATE TABLE "availabilities" (
    "id" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- services
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- nurse_services
CREATE TABLE "nurse_services" (
    "id" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    CONSTRAINT "nurse_services_pkey" PRIMARY KEY ("id")
);

-- bookings
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "guestName" TEXT,
    "guestPhone" TEXT,
    "guestEmail" TEXT,
    "nurseId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "scheduledAt" TIMESTAMP(3),
    "notes" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "price" DOUBLE PRECISION NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "nurseAmount" DOUBLE PRECISION NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "enRouteAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- payments
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TND',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "PaymentProvider" NOT NULL DEFAULT 'MOCK',
    "providerRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- invoices
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL,
    "nurseAmount" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "pdfUrl" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- commissions
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "platformAmount" DOUBLE PRECISION NOT NULL,
    "nurseAmount" DOUBLE PRECISION NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- payouts
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- revenues
CREATE TABLE "revenues" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "platformAmount" DOUBLE PRECISION NOT NULL,
    "nurseAmount" DOUBLE PRECISION NOT NULL,
    "serviceSlug" TEXT NOT NULL,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revenues_pkey" PRIMARY KEY ("id")
);

-- tracking_sessions
CREATE TABLE "tracking_sessions" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLat" DOUBLE PRECISION,
    "lastLng" DOUBLE PRECISION,
    "lastUpdate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    CONSTRAINT "tracking_sessions_pkey" PRIMARY KEY ("id")
);

-- live_locations
CREATE TABLE "live_locations" (
    "id" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "bookingId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "live_locations_pkey" PRIMARY KEY ("id")
);

-- reviews
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- favorites
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- notifications
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERIC',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Indexes & uniques
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
CREATE INDEX "users_role_idx" ON "users"("role");

CREATE UNIQUE INDEX "patient_profiles_userId_key" ON "patient_profiles"("userId");
CREATE INDEX "patient_profiles_city_idx" ON "patient_profiles"("city");

CREATE UNIQUE INDEX "nurse_profiles_userId_key" ON "nurse_profiles"("userId");
CREATE INDEX "nurse_profiles_city_idx" ON "nurse_profiles"("city");
CREATE INDEX "nurse_profiles_verificationStatus_idx" ON "nurse_profiles"("verificationStatus");
CREATE INDEX "nurse_profiles_availability_idx" ON "nurse_profiles"("availability");

CREATE INDEX "nurse_documents_nurseId_idx" ON "nurse_documents"("nurseId");

CREATE INDEX "availabilities_nurseId_idx" ON "availabilities"("nurseId");
CREATE UNIQUE INDEX "availabilities_nurseId_dayOfWeek_startTime_key" ON "availabilities"("nurseId", "dayOfWeek", "startTime");

CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

CREATE INDEX "nurse_services_serviceId_idx" ON "nurse_services"("serviceId");
CREATE UNIQUE INDEX "nurse_services_nurseId_serviceId_key" ON "nurse_services"("nurseId", "serviceId");

CREATE INDEX "bookings_patientId_idx" ON "bookings"("patientId");
CREATE INDEX "bookings_nurseId_idx" ON "bookings"("nurseId");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_serviceId_idx" ON "bookings"("serviceId");

CREATE UNIQUE INDEX "payments_bookingId_key" ON "payments"("bookingId");
CREATE INDEX "payments_status_idx" ON "payments"("status");

CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");
CREATE UNIQUE INDEX "invoices_bookingId_key" ON "invoices"("bookingId");
CREATE INDEX "invoices_nurseId_idx" ON "invoices"("nurseId");

CREATE UNIQUE INDEX "commissions_bookingId_key" ON "commissions"("bookingId");
CREATE INDEX "commissions_nurseId_idx" ON "commissions"("nurseId");
CREATE INDEX "commissions_status_idx" ON "commissions"("status");

CREATE INDEX "payouts_nurseId_idx" ON "payouts"("nurseId");
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

CREATE UNIQUE INDEX "revenues_bookingId_key" ON "revenues"("bookingId");
CREATE INDEX "revenues_createdAt_idx" ON "revenues"("createdAt");
CREATE INDEX "revenues_serviceSlug_idx" ON "revenues"("serviceSlug");

CREATE UNIQUE INDEX "tracking_sessions_bookingId_key" ON "tracking_sessions"("bookingId");
CREATE INDEX "tracking_sessions_nurseId_idx" ON "tracking_sessions"("nurseId");

CREATE INDEX "live_locations_nurseId_idx" ON "live_locations"("nurseId");
CREATE INDEX "live_locations_bookingId_idx" ON "live_locations"("bookingId");

CREATE UNIQUE INDEX "reviews_bookingId_key" ON "reviews"("bookingId");
CREATE INDEX "reviews_nurseId_idx" ON "reviews"("nurseId");

CREATE UNIQUE INDEX "favorites_userId_nurseId_key" ON "favorites"("userId", "nurseId");

CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- Foreign keys
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nurse_profiles" ADD CONSTRAINT "nurse_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nurse_documents" ADD CONSTRAINT "nurse_documents_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "nurse_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "nurse_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nurse_services" ADD CONSTRAINT "nurse_services_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "nurse_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nurse_services" ADD CONSTRAINT "nurse_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "nurse_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "nurse_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "nurse_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "nurse_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tracking_sessions" ADD CONSTRAINT "tracking_sessions_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_locations" ADD CONSTRAINT "live_locations_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "nurse_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "live_locations" ADD CONSTRAINT "live_locations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "nurse_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "nurse_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
