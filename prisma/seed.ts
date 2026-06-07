import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const hash = (p: string) => bcrypt.hash(p, 12);

// Quelques villes tunisiennes avec coordonnées approximatives.
const CITIES = [
  { city: "Tunis", lat: 36.8065, lng: 10.1815 },
  { city: "Ariana", lat: 36.8625, lng: 10.1956 },
  { city: "Sfax", lat: 34.7406, lng: 10.7603 },
  { city: "Sousse", lat: 35.8254, lng: 10.6369 },
  { city: "Nabeul", lat: 36.4561, lng: 10.7376 },
];

const SPECIALTIES = ["Pansement", "Injection", "Prise de sang", "Perfusion", "Soins post-opératoires"];

async function main() {
  console.log("🌱 Seed en cours...");

  // ----- Admin -----
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

  // ----- Patient démo -----
  const patientCity = CITIES[0]!;
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
      patientProfile: {
        create: {
          city: patientCity.city,
          address: "Avenue Habib Bourguiba, Tunis",
          latitude: patientCity.lat,
          longitude: patientCity.lng,
        },
      },
    },
  });

  // ----- Infirmiers démo (validés) -----
  const firstNames = ["Amira", "Sami", "Ines", "Khaled", "Mariem", "Youssef", "Leila", "Bilel"];
  const lastNames = ["Ben Ali", "Trabelsi", "Gharbi", "Mejri", "Haddad", "Khelifi"];

  for (let i = 0; i < 8; i++) {
    const loc = CITIES[i % CITIES.length]!;
    const email = `infirmier${i + 1}@demo.tn`;
    const jitterLat = (Math.random() - 0.5) * 0.05;
    const jitterLng = (Math.random() - 0.5) * 0.05;

    await prisma.user.upsert({
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
            specialties: SPECIALTIES.slice(0, 2 + (i % 3)),
            yearsOfExperience: 2 + (i % 12),
            pricePerVisit: 30 + (i % 5) * 10,
            city: loc.city,
            address: `Quartier ${loc.city}`,
            latitude: loc.lat + jitterLat,
            longitude: loc.lng + jitterLng,
            interventionRadiusKm: 15,
            verificationStatus: i === 7 ? "PENDING" : "APPROVED",
            verifiedAt: i === 7 ? null : new Date(),
            isAvailable: true,
            ratingAverage: i === 7 ? 0 : 4 + (i % 2) * 0.5,
            ratingCount: i === 7 ? 0 : 3 + i,
            availabilities: {
              create: [
                { dayOfWeek: "MONDAY", startTime: "08:00", endTime: "17:00" },
                { dayOfWeek: "WEDNESDAY", startTime: "08:00", endTime: "17:00" },
                { dayOfWeek: "FRIDAY", startTime: "09:00", endTime: "15:00" },
              ],
            },
          },
        },
      },
    });
  }

  console.log("✅ Seed terminé.");
  console.log("   Admin    : admin@infirmier.tn / Admin1234");
  console.log("   Patient  : patient@demo.tn / Patient1234");
  console.log("   Infirmier: infirmier1@demo.tn / Nurse1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
