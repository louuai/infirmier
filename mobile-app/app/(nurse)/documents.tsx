import { useCallback, useState } from "react";
import { View, Text, TextInput, Alert, ActivityIndicator, Pressable } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen, Card, Muted, Button, Badge } from "@/components/ui";
import { Topbar } from "@/components/topbar";
import { api, apiBase } from "@/api/client";
import { useAuth } from "@/store/auth";

export default function NurseDocuments() {
  const token = useAuth((s) => s.token);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"DIPLOMA" | "CIN">("DIPLOMA");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api("/api/nurses/me").then((d) => { setDocs(d.data.nurse?.documents ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function addUrl() {
    if (!url) return;
    setBusy(true);
    try { await api("/api/nurses/me/documents", { method: "POST", body: { type, fileUrl: url } }); setUrl(""); load(); }
    catch (e: any) { Alert.alert("Erreur", e.message); } finally { setBusy(false); }
  }

  async function pickAndUpload() {
    setBusy(true);
    try {
      const ImagePicker = await import("expo-image-picker");
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert("Permission refusée"); setBusy(false); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      if (res.canceled) { setBusy(false); return; }
      const asset = res.assets[0];
      const form = new FormData();
      form.append("file", { uri: asset.uri, name: asset.fileName ?? "doc.jpg", type: "image/jpeg" } as any);
      const up = await fetch(`${apiBase}/api/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const d = await up.json();
      if (!up.ok) { Alert.alert("Upload", d.error ?? "Indisponible — utilisez un lien."); setBusy(false); return; }
      await api("/api/nurses/me/documents", { method: "POST", body: { type, fileUrl: d.data.url } });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setBusy(false); }
  }

  async function takePhoto() {
    setBusy(true);
    try {
      const ImagePicker = await import("expo-image-picker");
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert("Permission caméra refusée"); setBusy(false); return; }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (res.canceled) { setBusy(false); return; }
      const asset = res.assets[0];
      const form = new FormData();
      form.append("file", { uri: asset.uri, name: "scan.jpg", type: "image/jpeg" } as any);
      const up = await fetch(`${apiBase}/api/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const d = await up.json();
      if (!up.ok) { Alert.alert("Upload", d.error ?? "Indisponible — utilisez un lien."); setBusy(false); return; }
      await api("/api/nurses/me/documents", { method: "POST", body: { type, fileUrl: d.data.url } });
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setBusy(false); }
  }

  const inputCls = "rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white";

  return (
    <Screen>
      <Topbar title="Mes documents" />
      <Card className="mb-4">
        <Muted>Diplôme d'État + CIN. Visibles uniquement par l'administrateur pour validation.</Muted>
        <View className="mt-3 flex-row gap-2">
          {(["DIPLOMA", "CIN"] as const).map((t) => (
            <Pressable key={t} onPress={() => setType(t)} className={`rounded-full px-4 py-2 ${type === t ? "bg-emerald-500" : "border border-white/15"}`}>
              <Text className={type === t ? "text-white" : "text-slate-400"}>{t === "DIPLOMA" ? "Diplôme" : "CIN"}</Text>
            </Pressable>
          ))}
        </View>
        <View className="mt-3">
          <TextInput value={url} onChangeText={setUrl} placeholder="https://lien-du-document" placeholderTextColor="#64748b" className={inputCls} autoCapitalize="none" />
        </View>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Button title="Ajouter le lien" onPress={addUrl} loading={busy} />
          <Button title="📷 Caméra" variant="ghost" onPress={takePhoto} />
          <Button title="📁 Fichier" variant="ghost" onPress={pickAndUpload} />
        </View>
      </Card>

      {loading ? <ActivityIndicator color="#2fe0a6" /> : docs.length === 0 ? <Muted>Aucun document déposé.</Muted> : docs.map((d) => (
        <Card key={d.id} className="mb-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-white">{d.type === "DIPLOMA" ? "Diplôme" : "CIN"}</Text>
            {d.verified && <Badge text="vérifié" tone="success" />}
          </View>
        </Card>
      ))}
    </Screen>
  );
}
