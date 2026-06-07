import type {
  InitPaymentParams,
  InitPaymentResult,
  PaymentGateway,
  VerifyPaymentResult,
} from "./types";

/**
 * Squelette d'intégration Flouci (https://flouci.com).
 * Brancher l'API réelle ici quand les identifiants sont disponibles.
 * Les méthodes lèvent une erreur tant que ce n'est pas implémenté.
 */
export class FlouciGateway implements PaymentGateway {
  readonly name = "FLOUCI" as const;

  private appToken = process.env.FLOUCI_APP_TOKEN ?? "";
  private appSecret = process.env.FLOUCI_APP_SECRET ?? "";

  async init(_params: InitPaymentParams): Promise<InitPaymentResult> {
    // TODO: POST https://developers.flouci.com/api/generate_payment
    throw new Error("Intégration Flouci non encore configurée");
  }

  async verify(_providerRef: string): Promise<VerifyPaymentResult> {
    // TODO: GET https://developers.flouci.com/api/verify_payment/{id}
    throw new Error("Intégration Flouci non encore configurée");
  }
}
