import { useCallback, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "@/api/client";

interface Convo {
  id: string;
  kind: string;
  bookingService: string | null;
  other: { name: string; role: string } | null;
  lastMessage: string | null;
  unread: number;
}

export function Conversations({ showAdminButton }: { showAdminButton?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api("/api/conversations")
      .then((d) => {
        setItems(d.data.conversations);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function contactAdmin() {
    try {
      const d = await api("/api/conversations", { method: "POST", body: { target: "admin" } });
      router.push(`/chat/${d.data.conversationId}`);
    } catch {}
  }

  return (
    <View style={{ flex: 1 }}>
      {showAdminButton && (
        <Pressable
          onPress={contactAdmin}
          style={{ margin: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderRadius: 999, padding: 12, alignItems: "center" }}
        >
          <Text style={{ color: "#fff" }}>Contacter l'administrateur</Text>
        </Pressable>
      )}
      {loading ? (
        <ActivityIndicator color="#2fe0a6" style={{ marginTop: 20 }} />
      ) : items.length === 0 ? (
        <Text style={{ color: "#64748b", textAlign: "center", marginTop: 30 }}>Aucune conversation.</Text>
      ) : (
        items.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => router.push(`/chat/${c.id}`)}
            style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {c.other?.name ?? "Conversation"}
                {c.bookingService ? ` · ${c.bookingService}` : c.other?.role === "ADMIN" ? " · Admin" : ""}
              </Text>
              <Text numberOfLines={1} style={{ color: "#64748b", fontSize: 12 }}>
                {c.lastMessage ?? "—"}
              </Text>
            </View>
            {c.unread > 0 && (
              <View style={{ backgroundColor: "#10b981", borderRadius: 999, paddingHorizontal: 7, justifyContent: "center" }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{c.unread}</Text>
              </View>
            )}
          </Pressable>
        ))
      )}
    </View>
  );
}
