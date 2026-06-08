import { config } from "@/lib/config";
import { MockGateway } from "./mock";
import { FlouciGateway } from "./flouci";
import { KonnectGateway } from "./konnect";
import { D17Gateway } from "./d17";
import { CardGateway } from "./card";
import type { PaymentGateway } from "./types";

/** Renvoie le fournisseur de paiement actif selon PAYMENT_PROVIDER. */
export function getPaymentGateway(): PaymentGateway {
  switch (config.paymentProvider) {
    case "flouci":
      return new FlouciGateway();
    case "d17":
      return new D17Gateway();
    case "card":
      return new CardGateway();
    case "konnect":
      return new KonnectGateway();
    case "mock":
    default:
      return new MockGateway();
  }
}

export * from "./types";
