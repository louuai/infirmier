import { useCallback, useState } from "react";
import { View, Text, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Button, Field, Chip, Badge, Avatar, Stat, SectionLabel, FadeIn } from "@/components/ui";
import { api } from "@/api/client";
import { useAuth } from "@/store/auth";
import { detectAddress } from "@/lib/location";
import { theme } from "@/theme";

const AVAIL = [{ k: "AVAILABLE", l: "Disponible", i: "flash" }, { k: "BUSY", l: "Occupé", i: "time" }, { k: "OFFLINE", l: "Hors ligne", i: "moon" }] as const;

export default function NurseProfile() {
  const router = useRouter();
  const logout = useAuth((s) => s.logout);
  const user = useAuth((s) => s.user);
  const [profile, setProfile] = useState<any>(null);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ bio: "", yearsOfExperience: "0", city: "", address: "", interventionRadiusKm: "15" });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api("/api/nurses/me"), api("/api/services?all=1")])
      .then(([p, s]) => {
        const n = p.data.nurse;
        setProfile(n);
        setAllServices(s.data.services ?? []);
        setSelected((n?.services ?? []).map((x: any) => x.service?.id ?? x.serviceId));
        setForm({
          bio: n?.bio ?? "", yearsOfExperience: String(n?.yearsOfExperience ?? 0),
          city: n?.city ?? "", address: n?.address ?? "", interventionRadiusKm: String(n?.interventionRadiusKm ?? 15),
        });
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function setAvail(availability: string) {
    setProfile((p: any) => ({ ...p, availability }));
    try { await api("/api/nurses/me", { method: "PATCH", body: { profile: { availability } } }); } catch {}
  }

  async function save() {
    setSaving(true);
    try {
      await api("/api/nurses/me", { method: "PATCH", body: { profile: {
        bio: form.bio, yearsOfExperience: Number(form.yearsOfExperience) || 0,
        city: form.city, address: form.address, interventionRadiusKm: Number(form.interventionRadiusKm) || 15,
        latitude: coords?.lat, longitude: coords?.lng, serviceIds: selected,
      } } });
      Alert.alert("✓ Profil mis à jour");
    } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setSaving(false); }
  }

  async function geolocate() {
    setLocating(true);
    try {
      const d = await detectAddress();
      if (d) { setCoords({ lat: d.lat, lng: d.lng }); setForm((f) => ({ ...f, address: d.address || f.address, city: d.city || f.city })); Alert.alert("✓ Position enregistrée", d.address || `${d.lat.toFixed(3)}, ${d.lng.toFixed(3)}`); }
      else Alert.alert("Localisation refusée");
    } finally { setLocating(false); }
  }

  if (loading) return <Screen><ActivityIndicator color={theme.teal} /></Screen>;

  const approved = profile?.verificationStatus === "APPROVED";

  return (
    <Screen>
      <FadeIn>
        <Card style={{ marginBottom: 14 }} glow>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Avatar name={user ? `${user.firstName} ${user.lastName}` : "Infirmier"} size={60} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 19, fontWeight: "800" }}>{user?.firstName} {user?.lastName}</Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 5 }}>
                <Badge text="Infirmier" tone="info" />
                <Badge text={approved ? "✓ Vérifié" : "En attente"} tone={approved ? "success" : "warning"} />
              </View>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
            <Stat label="Note" value={`★ ${(profile?.ratingAverage ?? 0).toFixed(1)}`} icon="star" tone="warning" />
            <Stat label="Avis" value={`${profile?.ratingCount ?? 0}`} icon="chatbox" tone="info" />
            <Stat label="Rayon" value={`${profile?.interventionRadiusKm ?? 15} km`} icon="navigate" tone="default" />
          </View>
        </Card>
      </FadeIn>

      <SectionLabel>Disponibilité</SectionLabel>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {AVAIL.map((a) => <Chip key={a.k} label={a.l} icon={a.i} active={profile?.availability === a.k} onPress={() => setAvail(a.k)} />)}
      </View>

      {!approved && (
        <Card style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Ionicons name="alert-circle" size={18} color={theme.amber} />
            <Text style={{ color: "#fcd34d", flex: 1 }}>Compte en attente. Déposez votre diplôme + CIN dans l'onglet Documents pour recevoir des missions.</Text>
          </View>
        </Card>
      )}

      <SectionLabel>Mes informations</SectionLabel>
      <Card style={{ marginBottom: 14 }}>
        <Field label="Bio" icon="document-text" value={form.bio} onChangeText={(v) => setForm({ ...form, bio: v })} multiline placeholder="Présentez-vous en quelques mots…" />
        <Field label="Années d'expérience" icon="ribbon" value={form.yearsOfExperience} onChangeText={(v) => setForm({ ...form, yearsOfExperience: v })} keyboardType="number-pad" />
        <Field label="Ville" icon="business" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
        <Field label="Adresse" icon="home" value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} />
        <Field label="Rayon d'intervention (km)" icon="navigate" value={form.interventionRadiusKm} onChangeText={(v) => setForm({ ...form, interventionRadiusKm: v })} keyboardType="number-pad" />
        <Button title={locating ? "Localisation…" : coords ? "Position mise à jour ✓" : "Me géolocaliser"} icon="locate" variant="ghost" onPress={geolocate} loading={locating} />
      </Card>

      <SectionLabel>Services proposés</SectionLabel>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {allServices.map((s) => (
          <Chip key={s.id} label={s.name} active={selected.includes(s.id)}
            onPress={() => setSelected((p) => p.includes(s.id) ? p.filter((x) => x !== s.id) : [...p, s.id])} />
        ))}
      </View>

      <Button title="Enregistrer les modifications" icon="save" onPress={save} loading={saving} />
      <View style={{ height: 12 }} />
      <Button title="Déconnexion" icon="log-out" variant="danger" onPress={async () => { await logout(); router.replace("/(public)/landing"); }} />
    </Screen>
  );
}
