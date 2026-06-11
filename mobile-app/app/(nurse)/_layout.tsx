import { Tabs } from "expo-router";

export default function NurseLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#06101f", borderTopColor: "rgba(255,255,255,0.1)" },
        tabBarActiveTintColor: "#2fe0a6",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Demandes" }} />
      <Tabs.Screen name="earnings" options={{ title: "Revenus" }} />
      <Tabs.Screen name="documents" options={{ title: "Documents" }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}
