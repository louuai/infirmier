import { randomUUID } from "crypto";
import type {
  InitPaymentParams,
  InitPaymentResult,
  PaymentGateway,
  VerifyPaymentResult,
} from "./types";

/**
 * Fournisseur factice : valide immédiatement le paiement.
 * Utile en dev et pour les tests. À remplacer par Flouci/Konnect en prod.
 */
export class MockGateway implements PaymentGateway {
  readonly name = "MOCK" as const;

  async init(_params: InitPaymentParams): Promise<InitPaymentResult> {
    return {
      providerRef: `mock_${randomUUID()}`,
      redirectUrl: null,
      status: "PAID",
    };
  }

  async verify(providerRef: string): Promise<VerifyPaymentResult> {
    return { providerRef, status: "PAID" };
  }
}
