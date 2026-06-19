import { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Backdrop, Button, FadeIn, Press, SectionLabel } from "@/components/ui";
import { theme, grad } from "@/theme";

function Emblem() {
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, [pulse, float]);
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const y = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <View style={{ height: 188, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{ position: "absolute", width: 150, height: 150, borderRadius: 999, borderWidth: 2, borderColor: theme.teal, opacity: ringOpacity, transform: [{ scale: ringScale }] }} />
      <Animated.View style={{ transform: [{ translateY: y }] }}>
        <LinearGradient colors={grad.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 122, height: 122, borderRadius: 36, alignItems: "center", justifyContent: "center", shadowColor: theme.teal, shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } }}>
          <Ionicons name="medkit" size={56} color="#04121c" />
        </LinearGradient>
      </Animated.View>
      {/* mini-badges flottants */}
      <Animated.View style={{ position: "absolute", top: 18, right: 46, transform: [{ translateY: y }] }}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.glassStrong, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="heart" size={18} color={theme.rose} />
        </View>
      </Animated.View>
      <Animated.View style={{ position: "absolute", bottom: 14, left: 44, transform: [{ translateY: Animated.multiply(y, -1) }] }}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.glassStrong, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="shield-checkmark" size={18} color={theme.sky} />
        </View>
      </Animated.View>
    </View>
  );
}

function Step({ icon, n, title, text, delay }: { icon: keyof typeof Ionicons.glyphMap; n: string; title: string; text: string; delay: number }) {
  return (
    <FadeIn delay={delay}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12, borderRadius: 18, borderWidth: 1, borderColor: theme.borderSoft, backgroundColor: theme.glass, padding: 14 }}>
        <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(56,189,248,0.14)", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={icon} size={22} color={theme.sky} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: "700", fontSize: 15 }}>{n}. {title}</Text>
          <Text style={{ color: theme.textDim, fontSize: 12.5, marginTop: 2 }}>{text}</Text>
        </View>
      </View>
    </FadeIn>
  );
}

export default function Landing() {
  const router = useRouter();
  return (
    <Backdrop>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
          {/* HERO */}
          <LinearGradient colors={grad.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 30, paddingBottom: 40, paddingHorizontal: 20, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text }}>Infirmier<Text style={{ color: theme.sky }}>Tunis</Text></Text>
              <Press onPress={() => router.push("/login")}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: theme.glass }}>
                  <Ionicons name="lock-closed" size={13} color={theme.textDim} />
                  <Text style={{ fontSize: 12, color: theme.textDim, fontWeight: "600" }}>Espace pro</Text>
                </View>
              </Press>
            </View>

            <FadeIn delay={80}><Emblem /></FadeIn>
            <FadeIn delay={160}>
              <Text style={{ textAlign: "center", color: theme.text, fontSize: 30, fontWeight: "800", lineHeight: 36, letterSpacing: -0.5, marginTop: 6 }}>Un infirmier qualifié,{"\n"}à votre porte</Text>
              <Text style={{ textAlign: "center", color: theme.textDim, marginTop: 12, paddingHorizontal: 6, fontSize: 14.5, lineHeight: 21 }}>Pansement, injection, prise de sang… à domicile, partout en Tunisie. Sans créer de compte.</Text>
            </FadeIn>
          </LinearGradient>

          {/* CTA flottant */}
          <FadeIn delay={240} style={{ paddingHorizontal: 20, marginTop: -22 }}>
            <Button title="Trouver un infirmier" icon="search" onPress={() => router.push("/(public)/search")} />
            <View style={{ height: 12 }} />
            <Button title="Connexion infirmier / admin" icon="person" variant="ghost" onPress={() => router.push("/login")} />
          </FadeIn>

          {/* étapes */}
          <View style={{ marginTop: 30, paddingHorizontal: 20 }}>
            <SectionLabel>Comment ça marche</SectionLabel>
            <Step n="1" icon="medkit" title="Choisissez un soin" text="Sélectionnez le service dont vous avez besoin." delay={300} />
            <Step n="2" icon="navigate" title="On cherche autour de vous" text="Votre demande part aux infirmiers disponibles." delay={360} />
            <Step n="3" icon="card" title="Acceptation & paiement" text="Le premier qui accepte, vous payez en ligne." delay={420} />
            <Step n="4" icon="location" title="Suivi en temps réel" text="Suivez l'infirmier jusqu'à votre porte." delay={480} />
          </View>

          {/* réassurance */}
          <FadeIn delay={540} style={{ paddingHorizontal: 20, marginTop: 8 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[{ i: "shield-checkmark", t: "Vérifiés" }, { i: "flash", t: "Rapide" }, { i: "lock-closed", t: "Sécurisé" }].map((x) => (
                <View key={x.t} style={{ flex: 1, alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: theme.borderSoft, backgroundColor: theme.glass, paddingVertical: 14 }}>
                  <Ionicons name={x.i as any} size={20} color={theme.teal} />
                  <Text style={{ color: theme.textDim, fontSize: 12, marginTop: 6, fontWeight: "600" }}>{x.t}</Text>
                </View>
              ))}
            </View>
          </FadeIn>

          <Text style={{ textAlign: "center", color: theme.textFaint, fontSize: 11, marginTop: 26 }}>Soins infirmiers à domicile · Tunisie · 24/7</Text>
        </ScrollView>
      </SafeAreaView>
    </Backdrop>
  );
}
