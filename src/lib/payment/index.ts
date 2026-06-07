import { config } from "@/lib/config";
import { MockGateway } from "./mock";
import { FlouciGateway } from "./flouci";
import { KonnectGateway } from "./konnect";
import type { PaymentGateway } from "./types";

/** Factory : renvoie le fournisseur de paiement actif selon la config. */
export function getPaymentGateway(): PaymentGateway {
  switch (config.paymentProvider) {
    case "flouci":
      return new FlouciGateway();
    case "konnect":
      return new KonnectGateway();
    case "mock":
    default:
      return new MockGateway();
  }
}

export * from "./types";
