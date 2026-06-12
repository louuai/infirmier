import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "search",
  bookings: "list",
  messages: "chatbubble-ellipses",
  profile: "person",
};

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: "#06101f", borderTopColor: "rgba(255,255,255,0.08)", height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarActiveTintColor: "#2fe0a6",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => <Ionicons name={ICON[route.name] ?? "ellipse"} size={size} color={color} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Trouver" }} />
      <Tabs.Screen name="bookings" options={{ title: "Réservations" }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}
