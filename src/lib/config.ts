/** Configuration centralisée lue depuis l'environnement. */
export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  commissionRate: Number(process.env.PLATFORM_COMMISSION_RATE ?? "10"),
  paymentProvider: (process.env.PAYMENT_PROVIDER ?? "mock") as
    | "mock"
    | "flouci"
    | "konnect",
} as const;

/** Calcule la répartition d'un montant entre plateforme et infirmier. */
export function computeSplit(price: number, rate = config.commissionRate) {
  const commissionAmount = Math.round((price * rate) / 100 * 1000) / 1000;
  const nurseAmount = Math.round((price - commissionAmount) * 1000) / 1000;
  return { commissionRate: rate, commissionAmount, nurseAmount };
}
