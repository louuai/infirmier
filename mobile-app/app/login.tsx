import { useState } from "react";
import { View, Text } from "react-native";
import { useRouter, Link } from "expo-router";
import { Screen, H1, Muted, Field, Button, Center } from "@/components/ui";
import { useAuth } from "@/store/auth";

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
    <Screen>
      <Center>
        <View className="w-full max-w-sm">
          <Text className="mb-6 text-center text-3xl font-extrabold text-white">Infirmier<Text className="text-sky-400">Tunis</Text></Text>
          <H1>Connexion</H1>
          <Muted>Accédez à votre espace.</Muted>
          <View className="h-4" />
          <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="vous@exemple.tn" />
          <Field label="Mot de passe" secureTextEntry value={password} onChangeText={setPassword} />
          {error && <Text className="mb-2 text-sm text-rose-400">{error}</Text>}
          <Button title="Se connecter" onPress={onSubmit} loading={loading} />
          <View className="mt-4 flex-row justify-center">
            <Muted>Pas de compte ? </Muted>
            <Link href="/register" className="text-sky-400">S'inscrire</Link>
          </View>
        </View>
      </Center>
    </Screen>
  );
}
