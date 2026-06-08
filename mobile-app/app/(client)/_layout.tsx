import { Tabs } from "expo-router";
export default function ClientLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: "#06101f", borderTopColor: "rgba(255,255,255,0.1)" }, tabBarActiveTintColor: "#2fe0a6", tabBarInactiveTintColor: "#64748b" }}>
      <Tabs.Screen name="index" options={{ title: "Trouver" }} />
      <Tabs.Screen name="bookings" options={{ title: "Réservations" }} />
    </Tabs>
  );
}
