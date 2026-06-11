-- ============================================================
--  Migration 2 : Dispatch (type Bolt/inDrive)
--  - nouvel état SEARCHING (demande diffusée à tous les infirmiers)
--  - bookings.nurseId devient nullable (assigné seulement à l'acceptation)
-- ============================================================

ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'SEARCHING';

ALTER TABLE "bookings" ALTER COLUMN "nurseId" DROP NOT NULL;
