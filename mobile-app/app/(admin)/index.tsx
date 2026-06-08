import { useCallback, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen, Card, Muted } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { api } from "@/api/client";

export default function AdminHome() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useFocusEffect(useCallback(() => {
    setLoading(true);
    api("/api/admin/stats").then((d) => { setStats(d.data.stats); setLoading(false); }).catch(() => setLoading(false));
  }, []));

  const cards = stats ? [
    ["Chiffre d'affaires", `${stats.revenue} TND`], ["Commission (20%)", `${stats.commissionTotal} TND`],
    ["Revenus infirmiers", `${stats.nurseRevenue} TND`], ["Réservations", stats.bookings],
    ["Patients", stats.patients], ["Infirmiers", stats.nurses],
    ["Aujourd'hui", stats.bookingsToday], ["À valider", stats.pendingNurses],
  ] : [];

  return (
    <Screen>
      <Topbar title="Centre de contrôle" />
      {loading ? <ActivityIndicator color="#2fe0a6" /> : (
        <View className="flex-row flex-wrap gap-3">
          {cards.map(([l, v], i) => (
            <Card key={i} className="w-[47%]"><Muted>{l as string}</Muted><Text className="mt-1 text-lg font-bold text-white">{String(v)}</Text></Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
