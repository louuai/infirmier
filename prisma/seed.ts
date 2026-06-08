import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const hash = (p: string) => bcrypt.hash(p, 12);

const CITIES = [
  { city: "Tunis", lat: 36.8065, lng: 10.1815 },
  { city: "Ariana", lat: 36.8625, lng: 10.1956 },
  { city: "Sfax", lat: 34.7406, lng: 10.7603 },
  { city: "Sousse", lat: 35.8254, lng: 10.6369 },
  { city: "Nabeul", lat: 36.4561, lng: 10.7376 },
];

const SERVICES = [
  { slug: "infirmier-domicile", name: "Infirmier à domicile", price: 50, icon: "stethoscope", description: "Soins infirmiers généraux à votre domicile." },
  { slug: "prelevements-sanguins", name: "Prélèvements sanguins", price: 35, icon: "droplet", description: "Prise de sang à domicile, transmise au laboratoire." },
  { slug: "injections", name: "Injections", price: 30, icon: "syringe", description: "Injections intramusculaires ou sous-cutanées." },
  { slug: "pansements", name: "Pansements", price: 40, icon: "bandage", description: "Réfection de pansements et soins de plaies." },
  { slug: "soins-post-operatoires", name: "Soins post-opératoires", price: 70, icon: "activity", description: "Suivi et soins après une intervention chirurgicale." },
  { slug: "perfusions", name: "Perfusions", price: 60, icon: "iv", description: "Pose et surveillance de perfusions à domicile." },
  { slug: "assistance-personnes-agees", name: "Assistance personnes âgées", price: 80, icon: "heart-handshake", description: "Accompagnement et soins pour personnes âgées." },
];

async function main() {
  console.log("🌱 Seed v2...");

  // Services (tarifs centralisés)
  const services = [];
  for (const s of SERVICES) {
    services.push(
      await prisma.service.upsert({
        where: { slug: s.slug },
        update: { name: s.name, price: s.price, icon: s.icon, description: s.description, active: true },
        create: s,
      }),
    );
  }

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@infirmier.tn" },
    update: {},
    create: {
      email: "admin@infirmier.tn",
      passwordHash: await hash("Admin1234"),
      role: "ADMIN",
      firstName: "Super",
      lastName: "Admin",
    },
  });

  // Patient démo
  const pc = CITIES[0]!;
  await prisma.user.upsert({
    where: { email: "patient@demo.tn" },
    update: {},
    create: {
      email: "patient@demo.tn",
      passwordHash: await hash("Patient1234"),
      role: "PATIENT",
      firstName: "Mohamed",
      lastName: "Patient",
      phone: "+21620000000",
      patientProfile: { create: { city: pc.city, address: "Av. Habib Bourguiba, Tunis", latitude: pc.lat, longitude: pc.lng } },
    },
  });

  // Infirmiers
  const firstNames = ["Amira", "Sami", "Ines", "Khaled", "Mariem", "Youssef", "Leila", "Bilel"];
  const lastNames = ["Ben Ali", "Trabelsi", "Gharbi", "Mejri", "Haddad", "Khelifi"];
  const avail: ("AVAILABLE" | "BUSY" | "OFFLINE")[] = ["AVAILABLE", "AVAILABLE", "BUSY", "AVAILABLE", "OFFLINE", "AVAILABLE", "BUSY", "AVAILABLE"];

  for (let i = 0; i < 8; i++) {
    const loc = CITIES[i % CITIES.length]!;
    const email = `infirmier${i + 1}@demo.tn`;
    const lat = loc.lat + (Math.random() - 0.5) * 0.05;
    const lng = loc.lng + (Math.random() - 0.5) * 0.05;
    const offered = services.filter((_, idx) => (idx + i) % 2 === 0).slice(0, 4);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: await hash("Nurse1234"),
        role: "NURSE",
        firstName: firstNames[i % firstNames.length]!,
        lastName: lastNames[i % lastNames.length]!,
        phone: `+216${20000001 + i}`,
        nurseProfile: {
          create: {
            bio: "Infirmier(ère) diplômé(e) d'État, soins à domicile professionnels.",
            yearsOfExperience: 2 + (i % 12),
            city: loc.city,
            address: `Quartier ${loc.city}`,
            latitude: lat,
            longitude: lng,
            currentLat: lat,
            currentLng: lng,
            lastSeenAt: new Date(),
            interventionRadiusKm: 15,
            availability: avail[i]!,
            verificationStatus: i === 7 ? "PENDING" : "APPROVED",
            verifiedAt: i === 7 ? null : new Date(),
            ratingAverage: i === 7 ? 0 : 4 + (i % 2) * 0.5,
            ratingCount: i === 7 ? 0 : 3 + i,
          },
        },
      },
      include: { nurseProfile: true },
    });

    if (user.nurseProfile) {
      for (const svc of offered) {
        await prisma.nurseService.upsert({
          where: { nurseId_serviceId: { nurseId: user.nurseProfile.id, serviceId: svc.id } },
          update: {},
          create: { nurseId: user.nurseProfile.id, serviceId: svc.id },
        });
      }
    }
  }

  console.log("✅ Seed terminé.");
  console.log("   Admin    : admin@infirmier.tn / Admin1234");
  console.log("   Patient  : patient@demo.tn / Patient1234");
  console.log("   Infirmier: infirmier1@demo.tn / Nurse1234");
  console.log(`   ${SERVICES.length} services créés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
