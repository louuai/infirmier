import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter, Link } from "expo-router";
import { Screen, H1, Muted, Field, Button, Center } from "@/components/ui";
import { useAuth } from "@/store/auth";

export default function Register() {
  const router = useRouter();
  const register = useAuth((s) => s.register);
  const [role, setRole] = useState<"PATIENT" | "NURSE">("PATIENT");
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null); setLoading(true);
    try {
      await register({ ...f, email: f.email.trim(), phone: f.phone || undefined, role });
      router.replace("/");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <Screen>
      <Center>
        <View className="w-full max-w-sm">
          <H1>Inscription</H1>
          <Muted>Créez votre compte.</Muted>
          <View className="my-4 flex-row gap-2 rounded-full bg-white/5 p-1">
            {(["PATIENT", "NURSE"] as const).map((r) => (
              <Pressable key={r} onPress={() => setRole(r)} className={`flex-1 rounded-full py-2 ${role === r ? "bg-emerald-500" : ""}`}>
                <Text className={`text-center text-sm font-medium ${role === r ? "text-white" : "text-slate-400"}`}>{r === "PATIENT" ? "Patient" : "Infirmier"}</Text>
              </Pressable>
            ))}
          </View>
          <Field label="Prénom" value={f.firstName} onChangeText={(v) => setF({ ...f, firstName: v })} />
          <Field label="Nom" value={f.lastName} onChangeText={(v) => setF({ ...f, lastName: v })} />
          <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={f.email} onChangeText={(v) => setF({ ...f, email: v })} />
          <Field label="Téléphone" keyboardType="phone-pad" value={f.phone} onChangeText={(v) => setF({ ...f, phone: v })} />
          <Field label="Mot de passe" secureTextEntry value={f.password} onChangeText={(v) => setF({ ...f, password: v })} />
          {error && <Text className="mb-2 text-sm text-rose-400">{error}</Text>}
          <Button title="Créer mon compte" onPress={onSubmit} loading={loading} />
          <View className="mt-4 flex-row justify-center">
            <Muted>Déjà inscrit ? </Muted>
            <Link href="/login" className="text-sky-400">Se connecter</Link>
          </View>
        </View>
      </Center>
    </Screen>
  );
}
