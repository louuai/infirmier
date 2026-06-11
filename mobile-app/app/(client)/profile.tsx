import { useCallback, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen, Card, Muted, Button } from "@/components/ui";
import { api } from "@/api/client";
import { useAuth } from "@/store/auth";

export default function ClientProfile() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api("/api/bookings"), api("/api/favorites").catch(() => ({ data: { favorites: [] } }))])
      .then(([b, f]) => {
        setInvoices((b.data.bookings ?? []).filter((x: any) => x.invoice));
        setFavorites(f.data.favorites ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen>
      <Text className="mb-4 text-2xl font-extrabold text-white">Mon profil</Text>

      <Card className="mb-4">
        <Text className="text-lg font-semibold text-white">{user?.firstName} {user?.lastName}</Text>
        <Muted>{user?.email}</Muted>
        <Text className="mt-1 text-xs text-slate-500">{user?.role}</Text>
      </Card>

      <Text className="mb-2 font-semibold text-white">Mes factures</Text>
      {loading ? (
        <ActivityIndicator color="#2fe0a6" />
      ) : invoices.length === 0 ? (
        <Muted>Aucune facture.</Muted>
      ) : (
        invoices.map((b) => (
          <Card key={b.id} className="mb-2">
            <View className="flex-row justify-between">
              <Text className="text-white">{b.service.name}</Text>
              <Text className="font-semibold text-emerald-300">{b.price} TND</Text>
            </View>
            <Muted>{b.invoice?.number}</Muted>
          </Card>
        ))
      )}

      <Text className="mb-2 mt-4 font-semibold text-white">Favoris</Text>
      {favorites.length === 0 ? (
        <Muted>Aucun favori.</Muted>
      ) : (
        favorites.map((f) => (
          <Card key={f.id} className="mb-2">
            <Text className="text-white">{f.nurse?.user?.firstName} {f.nurse?.user?.lastName}</Text>
          </Card>
        ))
      )}

      <View className="mt-6">
        <Button title="Déconnexion" variant="danger" onPress={async () => { await logout(); router.replace("/login"); }} />
      </View>
    </Screen>
  );
}
