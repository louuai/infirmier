import { useState } from "react";
import { View, Text } from "react-native";
import { useRouter, Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Backdrop, Field, Button, FadeIn, Press } from "@/components/ui";
import { useAuth } from "@/store/auth";
import { theme, grad } from "@/theme";

export default function Login() {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null); setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <Backdrop>
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        <FadeIn>
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <LinearGradient colors={grad.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 76, height: 76, borderRadius: 24, alignItems: "center", justifyContent: "center", shadowColor: theme.teal, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } }}>
              <Ionicons name="medkit" size={38} color="#04121c" />
            </LinearGradient>
            <Text style={{ marginTop: 16, fontSize: 24, fontWeight: "800", color: theme.text }}>Infirmier<Text style={{ color: theme.sky }}>Tunis</Text></Text>
            <Text style={{ color: theme.textDim, marginTop: 4 }}>Espace infirmier & administrateur</Text>
          </View>
        </FadeIn>

        <FadeIn delay={120}>
          <View style={{ borderRadius: 24, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.glass, overflow: "hidden" }}>
            <LinearGradient colors={grad.glass} style={{ padding: 20 }}>
              <Text style={{ color: theme.text, fontSize: 19, fontWeight: "800", marginBottom: 4 }}>Connexion</Text>
              <Text style={{ color: theme.textDim, fontSize: 13, marginBottom: 16 }}>Accédez à votre tableau de bord.</Text>
              <Field label="Email" icon="mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="vous@exemple.tn" />
              <Field label="Mot de passe" icon="lock-closed" secureTextEntry value={password} onChangeText={setPassword} placeholder="••••••••" />
              {error && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Ionicons name="alert-circle" size={15} color={theme.rose} />
                  <Text style={{ color: theme.rose, fontSize: 13, flex: 1 }}>{error}</Text>
                </View>
              )}
              <Button title="Se connecter" icon="log-in" onPress={onSubmit} loading={loading} />
            </LinearGradient>
          </View>
        </FadeIn>

        <FadeIn delay={220}>
          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 18 }}>
            <Text style={{ color: theme.textDim }}>Pas de compte ? </Text>
            <Link href="/register" style={{ color: theme.sky, fontWeight: "700" }}>S'inscrire</Link>
          </View>
          <Press onPress={() => router.replace("/(public)/landing")}>
            <Text style={{ textAlign: "center", color: theme.textFaint, marginTop: 18 }}>← Retour à l'accueil</Text>
          </Press>
        </FadeIn>
      </View>
    </Backdrop>
  );
}
