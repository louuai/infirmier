import { useCallback, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Stat, SectionLabel, FadeIn } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { api } from "@/api/client";
import { theme } from "@/theme";

export default function Earnings() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useFocusEffect(useCallback(() => {
    setLoading(true);
    api("/api/bookings").then((d) => { setItems(d.data.bookings.filter((b: any) => b.status === "COMPLETED")); setLoading(false); }).catch(() => setLoading(false));
  }, []));

  const now = Date.now(); const day = 86400000;
  const sum = (since: number) => items.filter((b) => b.completedAt && now - new Date(b.completedAt).getTime() <= since).reduce((a, b) => a + b.nurseAmount, 0);
  const total = items.reduce((a, b) => a + b.nurseAmount, 0);
  const count = items.length;
  const avg = count ? Math.round(total / count) : 0;

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "";

  return (
    <Screen>
      <Topbar title="Revenus" />

      <FadeIn>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <Stat label="Aujourd'hui" value={`${sum(day)} TND`} icon="today" tone="success" />
          <Stat label="7 jours" value={`${sum(7 * day)} TND`} icon="calendar" tone="info" />
        </View>
      </FadeIn>
      <FadeIn delay={80}>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <Stat label="30 jours" value={`${sum(30 * day)} TND`} icon="trending-up" tone="info" />
          <Stat label="Total perçu" value={`${total} TND`} icon="wallet" tone="success" />
        </View>
      </FadeIn>
      <FadeIn delay={140}>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <Stat label="Missions" value={`${count}`} icon="checkmark-done" tone="default" />
          <Stat label="Moyenne / mission" value={`${avg} TND`} icon="stats-chart" tone="warning" />
        </View>
      </FadeIn>

      <SectionLabel>Historique</SectionLabel>
      {loading ? <ActivityIndicator color={theme.teal} /> : count === 0 ? (
        <Card><View style={{ alignItems: "center", paddingVertical: 16 }}><Ionicons name="wallet-outline" size={30} color={theme.textFaint} /><Text style={{ color: theme.textDim, marginTop: 10 }}>Aucune mission terminée pour l'instant.</Text><Muted>Vos gains apparaîtront ici après chaque mission.</Muted></View></Card>
      ) : items.map((b) => (
        <Card key={b.id} className="mb-2">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: "700" }}>{b.service.name}</Text>
              <Text style={{ color: theme.textFaint, fontSize: 12 }}>{fmtDate(b.completedAt)} · {b.patient ? `${b.patient.firstName}` : b.guestName ?? "Client"}</Text>
            </View>
            <Text style={{ color: theme.teal, fontWeight: "800", fontSize: 15 }}>+{b.nurseAmount} TND</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
