import type {
  InitPaymentParams,
  InitPaymentResult,
  PaymentGateway,
  VerifyPaymentResult,
} from "./types";

/**
 * Squelette d'intégration Konnect (https://konnect.network).
 * Brancher l'API réelle ici quand les identifiants sont disponibles.
 */
export class KonnectGateway implements PaymentGateway {
  readonly name = "KONNECT" as const;

  private apiKey = process.env.KONNECT_API_KEY ?? "";
  private walletId = process.env.KONNECT_WALLET_ID ?? "";

  async init(_params: InitPaymentParams): Promise<InitPaymentResult> {
    // TODO: POST https://api.konnect.network/api/v2/payments/init-payment
    throw new Error("Intégration Konnect non encore configurée");
  }

  async verify(_providerRef: string): Promise<VerifyPaymentResult> {
    // TODO: GET https://api.konnect.network/api/v2/payments/{id}
    throw new Error("Intégration Konnect non encore configurée");
  }
}
