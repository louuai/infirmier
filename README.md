# 🩺 Infirmier Tunis — Marketplace de soins infirmiers à domicile

Plateforme web permettant aux **patients** de réserver des **infirmiers** qualifiés à domicile partout en Tunisie : recherche géolocalisée, réservation d'un créneau, paiement en ligne, et confirmation. Les **infirmiers** acceptent ou refusent les demandes, gèrent leurs disponibilités et suivent leurs revenus. L'**administrateur** supervise utilisateurs, vérifications, réservations, paiements et commissions.

> La plateforme prélève automatiquement **10 % de commission** sur chaque réservation ; **90 %** reviennent à l'infirmier. Toutes les transactions sont historisées (`Payment`, `Commission`, `Invoice`).

---

## 🧱 Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| UI | Tailwind CSS, composants façon shadcn/ui, lucide-react |
| Backend | Next.js API Routes (Route Handlers) |
| Base de données | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (cookie httpOnly) + email/mot de passe, bcrypt |
| Cartes | OpenStreetMap + Leaflet (react-leaflet) |
| Paiement | Architecture *gateway* prête pour **Flouci** / **Konnect** (mock par défaut) |
| Validation | Zod |
| Logs | Pino |
| Déploiement | Docker + Docker Compose |

---

## 🗂️ Architecture des dossiers

```
infirmier-tunis/
├── prisma/
│   ├── schema.prisma          # Modèles + enums + relations
│   ├── seed.ts                # Données de démo (admin, patient, infirmiers)
│   └── migrations/            # Migrations SQL
├── src/
│   ├── app/
│   │   ├── (auth)/login | register      # Pages d'authentification
│   │   ├── search/                       # Recherche + carte Leaflet
│   │   ├── nurses/[id]/                  # Profil infirmier + réservation
│   │   ├── dashboard/patient | nurse/    # Espaces patient & infirmier
│   │   ├── admin/                        # Tableau de bord admin
│   │   └── api/                          # API Routes (REST)
│   │       ├── auth/ (register, login, logout, me)
│   │       ├── nurses/ (recherche, [id], me)
│   │       ├── bookings/ ([id], [id]/status)
│   │       ├── payments/  reviews/
│   │       └── admin/ (stats, users, nurses)
│   ├── components/            # Navbar, NurseCard, NursesMap, UI primitives
│   ├── lib/                   # prisma, auth, session, validations, errors,
│   │                          # logger, geo, config, payment/ (gateways)
│   └── types/
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🚀 Démarrage rapide

### Option A — Docker (recommandé)

Lance la base PostgreSQL + l'application, applique les migrations automatiquement :

```bash
docker compose up --build
```

Puis (dans un second terminal) injecte les données de démo :

```bash
docker compose exec app npx tsx prisma/seed.ts
```

L'application est disponible sur **http://localhost:3000**.

### Option B — Développement local

Prérequis : Node.js 20+ et un PostgreSQL accessible.

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
#   → ajuste DATABASE_URL et JWT_SECRET

# 3. Générer le client + appliquer les migrations
npx prisma generate
npx prisma migrate dev

# 4. (Optionnel) données de démo
npm run db:seed

# 5. Lancer en mode dev
npm run dev
```

---

## 🔑 Comptes de démonstration (après `seed`)

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@infirmier.tn` | `Admin1234` |
| Patient | `patient@demo.tn` | `Patient1234` |
| Infirmier | `infirmier1@demo.tn` | `Nurse1234` |

---

## 🧬 Modèle de données (Prisma)

`User` · `PatientProfile` · `NurseProfile` · `NurseDocument` · `Availability` · `Booking` (+ `BookingStatus`) · `Payment` · `Commission` · `Invoice` · `Review` · `Notification`.

Points clés :

- **Géolocalisation** : `NurseProfile` porte `latitude`, `longitude`, `interventionRadiusKm`. La recherche utilise une *bounding box* SQL puis la **formule de Haversine** (`src/lib/geo.ts`) pour trier par distance.
- **Commission** : calculée à la réservation (`computeSplit` dans `src/lib/config.ts`) et figée dans `Booking` (`commissionRate`, `commissionAmount`, `nurseAmount`). À la complétion de la visite, une `Commission` et une `Invoice` sont générées dans une transaction.
- **Note infirmier** : `ratingAverage` / `ratingCount` dénormalisés, recalculés à chaque avis.

---

## 🔌 API (aperçu)

| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Inscription (patient/infirmier) |
| POST | `/api/auth/login` | public | Connexion (cookie JWT) |
| GET | `/api/auth/me` | auth | Session courante |
| GET | `/api/nurses` | public | Recherche (ville, distance, spécialité, prix) |
| GET | `/api/nurses/[id]` | public | Profil public + avis |
| GET/PATCH | `/api/nurses/me` | infirmier | Profil & disponibilités |
| GET/POST | `/api/bookings` | auth | Lister / créer une réservation |
| GET/DELETE | `/api/bookings/[id]` | propriétaire | Détail / annuler (règle des 2 h) |
| PATCH | `/api/bookings/[id]/status` | infirmier | Accepter / refuser / démarrer / terminer |
| POST | `/api/payments` | patient | Initialiser/confirmer le paiement |
| POST | `/api/reviews` | patient | Laisser un avis |
| GET | `/api/admin/stats` | admin | Statistiques globales |
| GET/PATCH | `/api/admin/users` | admin | Lister / activer-désactiver |
| GET/PATCH | `/api/admin/nurses` | admin | Vérifier les documents |

---

## 💳 Intégration paiement (Flouci / Konnect)

L'abstraction `PaymentGateway` (`src/lib/payment/`) définit un contrat commun. Le fournisseur est choisi via `PAYMENT_PROVIDER` (`mock` | `flouci` | `konnect`). Les classes `FlouciGateway` et `KonnectGateway` sont des squelettes prêts à brancher l'API réelle (renseigner les clés dans `.env`). Le mode `mock` valide le paiement immédiatement — idéal en dev.

---

## 🔒 Sécurité (OWASP)

- Mots de passe hachés avec **bcrypt** (coût 12).
- **JWT** signé (jose) stocké dans un cookie `httpOnly`, `sameSite=lax`, `secure` en production.
- Contrôle d'accès par rôle côté **middleware** (pages) et côté **API** (`requireRole`).
- **Validation Zod** systématique des entrées ; réponses d'erreur normalisées.
- Pas d'exposition du `passwordHash` (sélections explicites / `SafeUser`).
- Logs **Pino** avec *redaction* des champs sensibles.

---

## 📦 Scripts npm

```bash
npm run dev            # serveur de développement
npm run build          # prisma generate + build production
npm run start          # serveur production
npm run typecheck      # vérification TypeScript
npm run prisma:migrate # migrations dev
npm run db:seed        # données de démo
```

---

## 🛣️ Pistes d'évolution

- Upload réel des documents (S3 / stockage local) et antivirus.
- Webhooks de confirmation Flouci/Konnect.
- Notifications temps réel (WebSocket) et e-mails transactionnels.
- Tests E2E (Playwright) et tests unitaires (Vitest).

---

Fait avec ❤️ pour améliorer l'accès aux soins à domicile en Tunisie.
