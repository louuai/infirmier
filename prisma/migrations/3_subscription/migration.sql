-- Nouveau modèle : paiement client sur place + abonnement SaaS infirmier.

-- 1) Nouveau statut de réservation : acceptée, suivi direct, paiement sur place.
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';

-- 2) Champs d'abonnement sur le profil infirmier.
ALTER TABLE "nurse_profiles" ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT;
ALTER TABLE "nurse_profiles" ADD COLUMN IF NOT EXISTS "subscriptionExpiresAt" TIMESTAMP(3);
ALTER TABLE "nurse_profiles" ADD COLUMN IF NOT EXISTS "subscriptionRequested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "nurse_profiles" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

-- 3) Donne 7 jours d'essai aux infirmiers déjà validés (sinon ils seraient bloqués).
UPDATE "nurse_profiles"
SET "trialEndsAt" = NOW() + INTERVAL '7 days'
WHERE "verificationStatus" = 'APPROVED'
  AND "trialEndsAt" IS NULL
  AND "subscriptionExpiresAt" IS NULL;
