import { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen, Card, Muted, Button } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { api } from "@/api/client";

export default function AdminServices() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", price: "", description: "" });

  const load = useCallback(() => {
    setLoading(true);
    api("/api/services?all=1").then((d) => { setItems(d.data.services); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function create() {
    try {
      await api("/api/services", { method: "POST", body: { name: form.name, slug: form.slug, price: Number(form.price), description: form.description || undefined } });
      setForm({ name: "", slug: "", price: "", description: "" }); setCreating(false); load();
    } catch (e: any) { Alert.alert("Erreur", e.message); }
  }
  async function setPrice(id: string, price: string) {
    try { await api(`/api/services/${id}`, { method: "PATCH", body: { price: Number(price) } }); load(); } catch {}
  }
  async function toggle(id: string, active: boolean) {
    try { await api(`/api/services/${id}`, { method: "PATCH", body: { active: !active } }); load(); } catch {}
  }
  async function remove(id: string) {
    Alert.alert("Supprimer ?", "", [{ text: "Annuler" }, { text: "Supprimer", style: "destructive", onPress: async () => { await api(`/api/services/${id}`, { method: "DELETE" }); load(); } }]);
  }

  const inputCls = "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white mb-2";

  return (
    <Screen>
      <Topbar title="Services & tarifs" />
      <Button title={creating ? "Annuler" : "+ Nouveau service"} variant="ghost" onPress={() => setCreating((v) => !v)} />
      {creating && (
        <Card className="my-3">
          <TextInput value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Nom" placeholderTextColor="#64748b" className={inputCls} />
          <TextInput value={form.slug} onChangeText={(v) => setForm({ ...form, slug: v })} placeholder="slug-du-service" placeholderTextColor="#64748b" autoCapitalize="none" className={inputCls} />
          <TextInput value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} placeholder="Prix TND" keyboardType="decimal-pad" placeholderTextColor="#64748b" className={inputCls} />
          <TextInput value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} placeholder="Description" placeholderTextColor="#64748b" className={inputCls} />
          <Button title="Créer" onPress={create} />
        </Card>
      )}
      {loading ? <ActivityIndicator color="#2fe0a6" className="mt-4" /> : items.map((s) => (
        <Card key={s.id} className="mb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-semibold text-white">{s.name}</Text>
              <Muted>{s.slug}</Muted>
            </View>
            <TextInput defaultValue={String(s.price)} keyboardType="decimal-pad" onEndEditing={(e) => setPrice(s.id, e.nativeEvent.text)} className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-right text-white" />
            <Text className="ml-1 text-slate-400">TND</Text>
          </View>
          <View className="mt-2 flex-row gap-2">
            <Pressable onPress={() => toggle(s.id, s.active)} className={`rounded-full px-3 py-1 ${s.active ? "bg-emerald-500/20" : "bg-slate-500/20"}`}>
              <Text className={s.active ? "text-emerald-300" : "text-slate-400"}>{s.active ? "Actif" : "Inactif"}</Text>
            </Pressable>
            <Pressable onPress={() => remove(s.id)} className="rounded-full bg-rose-500/20 px-3 py-1"><Text className="text-rose-300">Supprimer</Text></Pressable>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
