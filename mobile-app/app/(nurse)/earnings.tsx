import { useCallback, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen, Card, Muted } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { api } from "@/api/client";

export default function Earnings() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useFocusEffect(useCallback(() => {
    setLoading(true);
    api("/api/bookings").then((d) => { setItems(d.data.bookings.filter((b: any) => b.status === "COMPLETED")); setLoading(false); }).catch(() => setLoading(false));
  }, []));
  const now = Date.now(); const day = 86400000;
  const sum = (since: number) => items.filter((b) => b.completedAt && now - new Date(b.completedAt).getTime() <= since).reduce((a, b) => a + b.nurseAmount, 0);
  return (
    <Screen>
      <Topbar title="Revenus" />
      <View className="mb-4 flex-row gap-3">
        <Card className="flex-1"><Muted>Aujourd'hui</Muted><Text className="mt-1 text-xl font-bold text-white">{sum(day)} TND</Text></Card>
        <Card className="flex-1"><Muted>7 jours</Muted><Text className="mt-1 text-xl font-bold text-white">{sum(7 * day)} TND</Text></Card>
      </View>
      {loading ? <ActivityIndicator color="#2fe0a6" /> : items.map((b) => (
        <Card key={b.id} className="mb-2">
          <View className="flex-row justify-between"><Text className="text-white">{b.service.name}</Text><Text className="font-semibold text-emerald-300">{b.nurseAmount} TND</Text></View>
        </Card>
      ))}
    </Screen>
  );
}
