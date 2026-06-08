import "../global.css";
import { useEffect } from "react";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { View, ActivityIndicator } from "react-native";
import { queryClient } from "@/lib/query";
import { useAuth } from "@/store/auth";
import { registerForPush } from "@/lib/push";

export default function RootLayout() {
  const bootstrap = useAuth((s) => s.bootstrap);
  const loading = useAuth((s) => s.loading);

  useEffect(() => { bootstrap(); }, [bootstrap]);
  useEffect(() => { registerForPush().catch(() => {}); }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        {loading ? (
          <View style={{ flex: 1, backgroundColor: "#03040d", alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color="#2fe0a6" />
          </View>
        ) : (
          <Slot />
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
