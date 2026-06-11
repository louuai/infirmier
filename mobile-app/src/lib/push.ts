import Constants from "expo-constants";

/** True si on tourne dans Expo Go (push distant non supporté depuis SDK 53). */
const isExpoGo = Constants.executionEnvironment === "storeClient";

/** Demande la permission et récupère le token push Expo (uniquement en build natif). */
export async function registerForPush(): Promise<string | null> {
  if (isExpoGo) return null; // évite l'erreur expo-notifications dans Expo Go
  try {
    const Notifications = await import("expo-notifications");
    const { Platform } = await import("react-native");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== "granted") return null;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#2fe0a6",
      });
    }
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

/** Notification locale (marche aussi en Expo Go). */
export async function notifyLocal(title: string, body: string) {
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
  } catch {}
}
