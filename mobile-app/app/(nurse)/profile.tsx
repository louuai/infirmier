import { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen, Card, Muted, Button } from "@/components/ui";
import { api } from "@/api/client";
import { useAuth } from "@/store/auth";
import { getMyLocation } from "@/lib/location";

export default function NurseProfile() {
  const router = useRouter();
  const logout = useAuth((s) => s.logout);
  const [profile, setProfile] = useState<any>(null);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ bio: "", yearsOfExperience: "0", city: "", address: "", interventionRadiusKm: "15" });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api("/api/nurses/me"), api("/api/services?all=1")])
      .then(([p, s]) => {
        const n = p.data.nurse;
        setProfile(n);
        setAllServices(s.data.services ?? []);
        setSelected((n?.services ?? []).map((x: any) => x.service?.id ?? x.serviceId));
        setForm({
          bio: n?.bio ?? "",
          yearsOfExperience: String(n?.yearsOfExperience ?? 0),
          city: n?.city ?? "",
          address: n?.address ?? "",
          interventionRadiusKm: String(n?.interventionRadiusKm ?? 15),
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    setSaving(true);
    try {
      await api("/api/nurses/me", {
        method: "PATCH",
        body: {
          profile: {
            bio: form.bio,
            yearsOfExperience: Number(form.yearsOfExperience) || 0,
            city: form.city,
            address: form.address,
            interventionRadiusKm: Number(form.interventionRadiusKm) || 15,
            latitude: coords?.lat,
            longitude: coords?.lng,
            serviceIds: selected,
          },
        },
      });
      Alert.alert("Profil mis à jour");
    } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setSaving(false); }
  }

  async function geolocate() {
    const loc = await getMyLocation();
    if (loc) { setCoords(loc); Alert.alert("Position enregistrée", `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`); }
  }

  const inputCls = "rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white mb-3";

  if (loading) return <Screen><ActivityIndicator color="#2fe0a6" /></Screen>;

  return (
    <Screen>
      <Text className="mb-4 text-2xl font-extrabold text-white">Mon profil</Text>

      <Card className="mb-4">
        <Muted>Bio</Muted>
        <TextInput value={form.bio} onChangeText={(v) => setForm({ ...form, bio: v })} multiline className={inputCls + " mt-1"} placeholderTextColor="#64748b" />
        <Muted>Années d'expérience</Muted>
        <TextInput value={form.yearsOfExperience} onChangeText={(v) => setForm({ ...form, yearsOfExperience: v })} keyboardType="number-pad" className={inputCls + " mt-1"} placeholderTextColor="#64748b" />
        <Muted>Ville</Muted>
        <TextInput value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} className={inputCls + " mt-1"} placeholderTextColor="#64748b" />
        <Muted>Adresse</Muted>
        <TextInput value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} className={inputCls + " mt-1"} placeholderTextColor="#64748b" />
        <Muted>Rayon d'intervention (km)</Muted>
        <TextInput value={form.interventionRadiusKm} onChangeText={(v) => setForm({ ...form, interventionRadiusKm: v })} keyboardType="number-pad" className={inputCls + " mt-1"} placeholderTextColor="#64748b" />
        <Button title="Me géolocaliser" variant="ghost" onPress={geolocate} />
      </Card>

      <Text className="mb-2 font-semibold text-white">Services proposés</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {allServices.map((s) => {
          const on = selected.includes(s.id);
          return (
            <Pressable key={s.id} onPress={() => setSelected((p) => on ? p.filter((x) => x !== s.id) : [...p, s.id])} className={`rounded-full px-3 py-2 ${on ? "bg-emerald-500" : "border border-white/15"}`}>
              <Text className={on ? "text-white" : "text-slate-400"}>{s.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Button title="Enregistrer" onPress={save} loading={saving} />
      <View className="mt-4">
        <Button title="Déconnexion" variant="danger" onPress={async () => { await logout(); router.replace("/login"); }} />
      </View>
    </Screen>
  );
}
