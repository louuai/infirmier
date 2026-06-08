import type { InitPaymentParams, InitPaymentResult, PaymentGateway, VerifyPaymentResult } from "./types";

/** Squelette carte bancaire (passerelle tunisienne type SMT/ClicToPay). */
export class CardGateway implements PaymentGateway {
  readonly name = "CARD" as const;
  async init(_p: InitPaymentParams): Promise<InitPaymentResult> {
    throw new Error("Intégration carte bancaire non encore configurée");
  }
  async verify(_ref: string): Promise<VerifyPaymentResult> {
    throw new Error("Intégration carte bancaire non encore configurée");
  }
}
