import type { InitPaymentParams, InitPaymentResult, PaymentGateway, VerifyPaymentResult } from "./types";

/** Squelette D17 (La Poste Tunisienne). À brancher quand les identifiants seront fournis. */
export class D17Gateway implements PaymentGateway {
  readonly name = "D17" as const;
  async init(_p: InitPaymentParams): Promise<InitPaymentResult> {
    throw new Error("Intégration D17 non encore configurée");
  }
  async verify(_ref: string): Promise<VerifyPaymentResult> {
    throw new Error("Intégration D17 non encore configurée");
  }
}
