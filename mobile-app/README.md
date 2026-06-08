# 📱 Infirmier Tunis — Application mobile (Expo)

Application **unique** (client + infirmier + admin) en React Native / Expo, branchée sur
l'API du site web existant. Le dashboard s'ouvre **selon le rôle** après connexion.

Stack : Expo SDK 52, Expo Router, TypeScript, NativeWind, Zustand, React Query,
expo-location, expo-notifications, react-native-maps.

> 💸 Zéro budget, **aucun compte Google Play / Apple** requis.

---

## 1. Configuration

```bash
cd mobile-app
cp .env.example .env       # mets l'URL de ton API déployée
npm install
```

`.env` :
```
EXPO_PUBLIC_API_URL=https://infirmier-ufe3.vercel.app
```

---

## 2. Tester immédiatement (gratuit, sans rien installer côté store)

```bash
npx expo start
```
- Installe **Expo Go** (Play Store / App Store) sur ton téléphone.
- Scanne le QR code affiché → l'app tourne en direct. Idéal pour toi + tes premiers testeurs.

---

## 3. Générer un APK installable (gratuit) et le distribuer par lien

EAS Build offre des builds gratuits. Une seule fois :

```bash
npm install -g eas-cli
eas login                       # crée un compte Expo gratuit
eas build:configure
eas build -p android --profile preview
```
- Le profil `preview` (déjà configuré dans `eas.json`) produit un **APK**.
- À la fin, EAS te donne une **URL de téléchargement** : envoie ce lien aux infirmiers / à toi-même.
- Sur Android : ouvrir le lien → installer (autoriser « sources inconnues »). **Aucun Play Store.**

> Pour mettre à jour l'app, relance `eas build` et renvoie le nouveau lien
> (ou utilise `eas update` pour des mises à jour OTA instantanées).

---

## 4. Version Web / PWA

```bash
npx expo start --web        # version web de l'app mobile
```
Le **site Next.js** est déjà une **PWA installable** (Android & iPhone : « Ajouter à l'écran d'accueil »).

---

## Fonctionnalités par rôle

- **Client** : choisir un service, géolocalisation, infirmiers proches, demande, paiement après acceptation, **suivi temps réel sur carte**, historique.
- **Infirmier** : disponibilité (dispo/occupé/hors-ligne), demandes (accepter/refuser), **partage GPS temps réel**, étapes en route → arrivé → terminé, revenus.
- **Admin** : dashboard (CA, commission 20 %, revenus), **validation infirmiers** (diplôme/CIN), services.

## Notifications push

`expo-notifications` est configuré (permission demandée au démarrage, notifications locales prêtes).
Pour le push **serveur→app**, brancher l'envoi Expo Push côté backend (endpoint à ajouter :
stockage du token Expo + appel à `https://exp.host/--/api/v2/push/send`).

## Authentification

Login/inscription via l'API (`/api/auth/login` renvoie un **token JWT** stocké en `SecureStore`,
envoyé en `Authorization: Bearer`). Connexion Google : à brancher via `expo-auth-session` (clé Google déjà créée pour le web).
