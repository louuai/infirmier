/**
 * Abonnement SaaS infirmier. Le client paie l'infirmier SUR PLACE ;
 * l'infirmier paie un abonnement pour accéder à l'app et recevoir des missions.
 */
export const SUBSCRIPTION = {
  trialDays: 7,
  plans: {
    MONTHLY: { label: "Mensuel", price: 50, days: 30 },
    ANNUAL: { label: "Annuel", price: 500, days: 365 },
  } as Record<string, { label: string; price: number; days: number }>,
};

export interface NurseSubFields {
  subscriptionPlan: string | null;
  subscriptionExpiresAt: Date | string | null;
  trialEndsAt: Date | string | null;
}

/** État d'accès d'un infirmier (abonnement actif ou essai en cours). */
export function nurseAccess(n: NurseSubFields | null | undefined) {
  const now = Date.now();
  const subExp = n?.subscriptionExpiresAt ? new Date(n.subscriptionExpiresAt).getTime() : 0;
  const trialExp = n?.trialEndsAt ? new Date(n.trialEndsAt).getTime() : 0;
  const subActive = subExp > now;
  const trialActive = !subActive && trialExp > now;
  const ref = subActive ? subExp : trialExp;
  const daysLeft = ref > now ? Math.ceil((ref - now) / 86400000) : 0;
  return {
    active: subActive || trialActive,
    subActive,
    trialActive,
    daysLeft,
    expiresAt: subActive ? n?.subscriptionExpiresAt ?? null : n?.trialEndsAt ?? null,
    plan: n?.subscriptionPlan ?? null,
  };
}
