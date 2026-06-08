/** Services proposés (la source de vérité reste la table Service en base). */
export const SERVICE_CATALOG = [
  { slug: "infirmier-domicile", name: "Infirmier à domicile", icon: "Stethoscope" },
  { slug: "prelevements-sanguins", name: "Prélèvements sanguins", icon: "Droplet" },
  { slug: "injections", name: "Injections", icon: "Syringe" },
  { slug: "pansements", name: "Pansements", icon: "Bandage" },
  { slug: "soins-post-operatoires", name: "Soins post-opératoires", icon: "Activity" },
  { slug: "perfusions", name: "Perfusions", icon: "Droplets" },
  { slug: "assistance-personnes-agees", name: "Assistance personnes âgées", icon: "HeartHandshake" },
] as const;
