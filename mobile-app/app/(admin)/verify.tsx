import { useCallback, useState } from "react";
import { View, Text, Alert, Linking, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen, Card, Muted, Button } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { api } from "@/api/client";

export default function Verify() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    api("/api/admin/nurses?status=PENDING").then((d) => { setItems(d.data.nurses); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function decide(nurseId: string, decision: "APPROVED" | "REJECTED") {
    try { await api("/api/admin/nurses", { method: "PATCH", body: { nurseId, decision } }); load(); }
    catch (e: any) { Alert.alert("Erreur", e.message); }
  }

  return (
    <Screen>
      <Topbar title="Validation infirmiers" />
      {loading ? <ActivityIndicator color="#2fe0a6" /> : items.length === 0 ? <Muted>Aucun infirmier en attente.</Muted> : items.map((n) => (
        <Card key={n.id} className="mb-3">
          <Text className="font-semibold text-white">{n.user.firstName} {n.user.lastName}</Text>
          <Muted>{n.user.email} · {n.city ?? "—"}</Muted>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {(n.documents ?? []).map((d: any) => (
              <Pressable key={d.id} onPress={() => Linking.openURL(d.fileUrl)} className="rounded-full border border-white/15 px-3 py-1">
                <Text className="text-xs text-sky-300">{d.type === "DIPLOMA" ? "Diplôme" : "CIN"}</Text>
              </Pressable>
            ))}
            {(n.documents ?? []).length === 0 && <Muted>Aucun document</Muted>}
          </View>
          <View className="mt-3 flex-row gap-2">
            <Button title="Valider" onPress={() => decide(n.id, "APPROVED")} />
            <Button title="Refuser" variant="danger" onPress={() => decide(n.id, "REJECTED")} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
