import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "stats-chart",
  verify: "shield-checkmark",
  services: "pricetags",
  users: "people",
  messages: "chatbubble-ellipses",
};

export default function AdminLayout() {
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
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="verify" options={{ title: "Validation" }} />
      <Tabs.Screen name="services" options={{ title: "Services" }} />
      <Tabs.Screen name="users" options={{ title: "Users" }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
    </Tabs>
  );
}
