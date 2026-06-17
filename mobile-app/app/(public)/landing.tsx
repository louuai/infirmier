import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Easing, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Model3D } from "@/components/model3d";

function Feature({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return (
    <View className="mb-3 flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <View className="size-11 items-center justify-center rounded-xl bg-emerald-500/15">
        <Ionicons name={icon} size={22} color="#2fe0a6" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-white">{title}</Text>
        <Text className="text-xs text-slate-400">{text}</Text>
      </View>
    </View>
  );
}

export default function Landing() {
  const router = useRouter();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(30)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start();
  }, [fade, rise, pulse]);

  return (
    <View style={{ flex: 1, backgroundColor: "#03040d" }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
          {/* HERO */}
          <LinearGradient colors={["#0a2540", "#062b25", "#03040d"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 36, paddingBottom: 44, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-white">Infirmier<Text className="text-sky-400">Tunis</Text></Text>
              <Pressable onPress={() => router.push("/login")} className="flex-row items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5">
                <Ionicons name="lock-closed" size={13} color="#cbd5e1" />
                <Text className="text-xs text-slate-200">Espace pro</Text>
              </Pressable>
            </View>

            <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], alignItems: "center", marginTop: 8 }}>
              <Animated.View style={{ width: "100%", height: 280, transform: [{ scale: pulse.interpolate({ inputRange: [1, 1.12], outputRange: [1, 1.02] }) }] }}>
                <Model3D height={280} />
              </Animated.View>
              <Text className="mt-2 text-center text-3xl font-extrabold leading-tight text-white">Un infirmier qualifié,{"\n"}à votre porte</Text>
              <Text className="mt-3 px-2 text-center text-slate-300">Pansement, injection, prise de sang… à domicile, partout en Tunisie. Sans créer de compte.</Text>
            </Animated.View>
          </LinearGradient>

          {/* CTA */}
          <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], paddingHorizontal: 20, marginTop: -22 }}>
            <Pressable onPress={() => router.push("/(public)/search")} android_ripple={{ color: "rgba(255,255,255,0.15)" }}>
              <LinearGradient colors={["#35a8ff", "#2fe0a6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 999, paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, shadowColor: "#2fe0a6", shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } }}>
                <Ionicons name="search" size={20} color="#04121c" />
                <Text style={{ color: "#04121c", fontWeight: "800", fontSize: 16 }}>Trouver un infirmier</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => router.push("/login")} className="mt-3 items-center rounded-full border border-white/15 py-4">
              <Text className="font-semibold text-white">Connexion infirmier / admin</Text>
            </Pressable>
          </Animated.View>

          {/* COMMENT ÇA MARCHE */}
          <View className="mt-8 px-5">
            <Text className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500">/ Comment ça marche</Text>
            <Feature icon="medkit" title="1. Choisissez un soin" text="Sélectionnez le service dont vous avez besoin." />
            <Feature icon="navigate" title="2. On cherche autour de vous" text="Votre demande part aux infirmiers disponibles." />
            <Feature icon="card" title="3. Acceptation & paiement" text="Le premier qui accepte, vous payez en ligne." />
            <Feature icon="location" title="4. Suivi en temps réel" text="Suivez l'infirmier jusqu'à votre porte." />
          </View>

          <Text className="mt-8 text-center text-xs text-slate-600">Soins infirmiers à domicile · Tunisie · 24/7</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
