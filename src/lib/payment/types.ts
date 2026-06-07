export interface InitPaymentParams {
  bookingId: string;
  amount: number; // TND
  currency: string;
  description: string;
  customerEmail: string;
  successUrl: string;
  failUrl: string;
}

export interface InitPaymentResult {
  providerRef: string;
  /** URL de redirection vers la page de paiement (null pour mock auto-validé). */
  redirectUrl: string | null;
  status: "PENDING" | "PAID";
}

export interface VerifyPaymentResult {
  providerRef: string;
  status: "PENDING" | "PAID" | "FAILED";
}

/** Contrat commun à tous les fournisseurs de paiement. */
export interface PaymentGateway {
  readonly name: "MOCK" | "FLOUCI" | "KONNECT";
  init(params: InitPaymentParams): Promise<InitPaymentResult>;
  verify(providerRef: string): Promise<VerifyPaymentResult>;
}
