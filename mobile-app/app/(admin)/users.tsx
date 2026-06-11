import { useCallback, useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen, Card, Muted, Badge, Button, Field } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { api } from "@/api/client";

const KEY_LABELS: Record<string, string> = {
  missions: "Missions", revenuBrut: "Revenu brut", revenuNet: "Revenu net", aTransferer: "À transférer",
  note: "Note moyenne", reservations: "Réservations", totalDepense: "Total dépensé",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", role: "PATIENT" });

  const load = useCallback(() => {
    setLoading(true);
    api("/api/admin/users").then((d) => { setUsers(d.data.users); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function open(id: string) {
    setDetail({ loading: true });
    const d = await api(`/api/admin/users/${id}`);
    setDetail(d.data);
  }
  async function transfer(nurseId: string) {
    try { await api("/api/admin/payouts", { method: "PATCH", body: { nurseId } }); Alert.alert("Transfert effectué ✅"); if (detail?.user) open(detail.user.id); }
    catch (e: any) { Alert.alert("Erreur", e.message); }
  }
  async function patch(id: string, data: any) {
    await api(`/api/admin/users/${id}`, { method: "PATCH", body: data }); load(); open(id);
  }
  async function remove(id: string) {
    Alert.alert("Supprimer ?", "", [{ text: "Annuler" }, { text: "Supprimer", style: "destructive", onPress: async () => {
      try { await api(`/api/admin/users/${id}`, { method: "DELETE" }); setDetail(null); load(); } catch (e: any) { Alert.alert("Erreur", e.message); }
    } }]);
  }
  async function create() {
    try {
      await api("/api/admin/users", { method: "POST", body: { ...form, phone: form.phone || undefined } });
      setCreating(false); setForm({ firstName: "", lastName: "", email: "", phone: "", password: "", role: "PATIENT" }); load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
  }

  // Fiche détaillée
  if (detail && detail.user) {
    const u = detail.user;
    return (
      <Screen>
        <Pressable onPress={() => setDetail(null)} className="mb-2"><Text className="text-slate-400">← Retour</Text></Pressable>
        <Text className="text-2xl font-extrabold text-white">{u.firstName} {u.lastName}</Text>
        <Muted>{u.email} · {u.role} · {u.isActive ? "actif" : "désactivé"}</Muted>

        <View className="mt-4 flex-row flex-wrap gap-3">
          {Object.entries(detail.analytics ?? {}).map(([k, v]) => (
            <Card key={k} className="w-[47%]"><Muted>{KEY_LABELS[k] ?? k}</Muted><Text className="mt-1 text-lg font-bold text-white">{String(v)}</Text></Card>
          ))}
        </View>

        {detail.pendingPayout > 0 && u.nurseProfile && (
          <View className="mt-4"><Button title={`Transférer ${detail.pendingPayout} TND à l'infirmier`} onPress={() => transfer(u.nurseProfile.id)} /></View>
        )}

        <View className="mt-4 flex-row flex-wrap gap-2">
          <Button title={u.isActive ? "Désactiver" : "Activer"} variant="ghost" onPress={() => patch(u.id, { isActive: !u.isActive })} />
          <Button title="Supprimer" variant="danger" onPress={() => remove(u.id)} />
        </View>
        <View className="mt-2 flex-row gap-2">
          {(["PATIENT", "NURSE", "ADMIN"] as const).map((r) => (
            <Pressable key={r} onPress={() => patch(u.id, { role: r })} className={`rounded-full px-3 py-2 ${u.role === r ? "bg-emerald-500" : "border border-white/15"}`}>
              <Text className={u.role === r ? "text-white" : "text-slate-400"}>{r}</Text>
            </Pressable>
          ))}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Topbar title="Utilisateurs" />
      <Button title={creating ? "Annuler" : "+ Nouvel utilisateur"} variant="ghost" onPress={() => setCreating((v) => !v)} />
      {creating && (
        <Card className="my-3">
          <Field label="Prénom" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
          <Field label="Nom" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
          <Field label="Email" autoCapitalize="none" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
          <Field label="Téléphone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />
          <Field label="Mot de passe (8+)" secureTextEntry value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} />
          <View className="mb-3 flex-row gap-2">
            {(["PATIENT", "NURSE", "ADMIN"] as const).map((r) => (
              <Pressable key={r} onPress={() => setForm({ ...form, role: r })} className={`rounded-full px-3 py-2 ${form.role === r ? "bg-emerald-500" : "border border-white/15"}`}>
                <Text className={form.role === r ? "text-white" : "text-slate-400"}>{r}</Text>
              </Pressable>
            ))}
          </View>
          <Button title="Créer" onPress={create} />
        </Card>
      )}
      {loading ? <ActivityIndicator color="#2fe0a6" /> : users.map((u) => (
        <Pressable key={u.id} onPress={() => open(u.id)}>
          <Card className="mb-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-1"><Text className="font-semibold text-white">{u.firstName} {u.lastName}</Text><Muted>{u.email}</Muted></View>
              <View className="items-end gap-1">
                <Badge text={u.role} />
                {!u.isActive && <Badge text="désactivé" tone="danger" />}
              </View>
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
