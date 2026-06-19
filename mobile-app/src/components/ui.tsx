import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { theme, grad } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

/* ---------- Backdrop + Screen ---------- */
export function Backdrop({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* halos lumineux doux */}
      <View pointerEvents="none" style={{ position: "absolute", top: -120, right: -80, width: 280, height: 280, borderRadius: 999, backgroundColor: "rgba(56,189,248,0.16)" }} />
      <View pointerEvents="none" style={{ position: "absolute", bottom: -140, left: -100, width: 320, height: 320, borderRadius: 999, backgroundColor: "rgba(47,224,166,0.12)" }} />
      {children}
    </View>
  );
}

export function Screen({ children, scroll = true, padded = true }: { children: ReactNode; scroll?: boolean; padded?: boolean }) {
  const pad = padded ? 16 : 0;
  return (
    <Backdrop>
      <SafeAreaView style={{ flex: 1 }}>
        {scroll ? (
          <ScrollView contentContainerStyle={{ padding: pad, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>{children}</ScrollView>
        ) : (
          <View style={{ flex: 1, padding: pad }}>{children}</View>
        )}
      </SafeAreaView>
    </Backdrop>
  );
}

/* ---------- Typo ---------- */
export function H1({ children }: { children: ReactNode }) {
  return <Text style={{ color: theme.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>{children}</Text>;
}
export function Muted({ children }: { children: ReactNode }) {
  return <Text style={{ color: theme.textDim, fontSize: 13, lineHeight: 19 }}>{children}</Text>;
}
export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={{ color: theme.textFaint, fontSize: 11, fontWeight: "700", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10 }}>{children}</Text>;
}

/* ---------- Animations ---------- */
export function FadeIn({ children, delay = 0, from = 18, style }: { children: ReactNode; delay?: number; from?: number; style?: any }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 480, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

/** Pressable avec animation de scale (micro-interaction). */
export function Press({ children, onPress, style, disabled }: { children: ReactNode; onPress?: () => void; style?: any; disabled?: boolean }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable onPress={onPress} disabled={disabled} onPressIn={() => to(0.96)} onPressOut={() => to(1)}>
      <Animated.View style={[{ transform: [{ scale: s }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

/* ---------- Cards (glass) ---------- */
export function GlassCard({ children, style, glow = false, className }: { children: ReactNode; style?: any; glow?: boolean; className?: string }) {
  return (
    <View className={className} style={[{ borderRadius: 22, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.glass, overflow: "hidden", shadowColor: glow ? theme.teal : "#000", shadowOpacity: glow ? 0.35 : 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }, style]}>
      <LinearGradient colors={grad.glass} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
        {children}
      </LinearGradient>
    </View>
  );
}
// compat : Card = GlassCard (conserve className pour les marges)
export function Card({ children, className, style, glow }: { children: ReactNode; className?: string; style?: any; glow?: boolean }) {
  return <GlassCard className={className} style={style} glow={glow}>{children}</GlassCard>;
}

/* ---------- Button ---------- */
export function Button({ title, onPress, loading, variant = "primary", icon, full = true }: { title: string; onPress: () => void; loading?: boolean; variant?: "primary" | "ghost" | "danger"; icon?: IconName; full?: boolean }) {
  const content = (
    <>
      {loading ? <ActivityIndicator color={variant === "ghost" ? theme.text : "#04121c"} /> : (
        <>
          {icon && <Ionicons name={icon} size={18} color={variant === "primary" ? "#04121c" : variant === "danger" ? "#fff" : theme.text} />}
          <Text style={{ fontWeight: "800", fontSize: 15, color: variant === "primary" ? "#04121c" : variant === "danger" ? "#fff" : theme.text }}>{title}</Text>
        </>
      )}
    </>
  );
  const inner =
    variant === "primary" ? (
      <LinearGradient colors={grad.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={btnStyle(true)}>{content}</LinearGradient>
    ) : variant === "danger" ? (
      <LinearGradient colors={grad.danger} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={btnStyle(true)}>{content}</LinearGradient>
    ) : (
      <View style={[btnStyle(false), { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.glass }]}>{content}</View>
    );
  return (
    <Press onPress={loading ? undefined : onPress} disabled={loading} style={{ width: full ? "100%" : undefined, opacity: loading ? 0.7 : 1 }}>
      <View style={{ borderRadius: 999, overflow: "hidden", shadowColor: variant === "primary" ? theme.teal : "transparent", shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }}>
        {inner}
      </View>
    </Press>
  );
}
function btnStyle(filled: boolean) {
  return { paddingVertical: 15, paddingHorizontal: 20, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 8 };
}

/* ---------- Field ---------- */
export function Field({ label, icon, ...props }: { label?: string; icon?: IconName } & React.ComponentProps<typeof TextInput>) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={{ color: theme.textDim, fontSize: 12, fontWeight: "600", marginBottom: 7 }}>{label}</Text>}
      <View style={{ flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, borderColor: focus ? theme.teal : theme.border, backgroundColor: focus ? "rgba(47,224,166,0.06)" : theme.glass, paddingHorizontal: 14 }}>
        {icon && <Ionicons name={icon} size={18} color={focus ? theme.teal : theme.textFaint} style={{ marginRight: 9 }} />}
        <TextInput
          placeholderTextColor={theme.textFaint}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{ flex: 1, paddingVertical: 13, color: theme.text, fontSize: 15 }}
          {...props}
        />
      </View>
    </View>
  );
}

/* ---------- Badge / Chip / Avatar / Stat ---------- */
const TONES: Record<string, { bg: string; fg: string }> = {
  default: { bg: "rgba(255,255,255,0.10)", fg: theme.textDim },
  success: { bg: "rgba(47,224,166,0.18)", fg: "#6ee7b7" },
  warning: { bg: "rgba(251,191,36,0.18)", fg: "#fcd34d" },
  danger: { bg: "rgba(251,113,133,0.18)", fg: "#fda4af" },
  info: { bg: "rgba(56,189,248,0.18)", fg: "#7dd3fc" },
};
export function Badge({ text, tone = "default" }: { text: string; tone?: keyof typeof TONES }) {
  const c = TONES[tone];
  return <Text style={{ overflow: "hidden", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, fontSize: 11, fontWeight: "700", backgroundColor: c.bg, color: c.fg }}>{text}</Text>;
}

export function Chip({ label, icon, active, onPress }: { label: string; icon?: IconName; active?: boolean; onPress?: () => void }) {
  return (
    <Press onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: active ? theme.teal : theme.border, backgroundColor: active ? "rgba(47,224,166,0.16)" : theme.glass }}>
        {icon && <Ionicons name={icon} size={15} color={active ? theme.teal : theme.textDim} />}
        <Text style={{ color: active ? theme.teal : theme.textDim, fontWeight: "700", fontSize: 13 }}>{label}</Text>
      </View>
    </Press>
  );
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <LinearGradient colors={grad.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#04121c", fontWeight: "800", fontSize: size * 0.36 }}>{initials}</Text>
    </LinearGradient>
  );
}

export function Stat({ label, value, icon, tone = "info" }: { label: string; value: string; icon: IconName; tone?: keyof typeof TONES }) {
  const c = TONES[tone];
  return (
    <GlassCard style={{ flex: 1 }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: c.bg, marginBottom: 10 }}>
        <Ionicons name={icon} size={19} color={c.fg} />
      </View>
      <Text style={{ color: theme.text, fontSize: 22, fontWeight: "800" }}>{value}</Text>
      <Text style={{ color: theme.textDim, fontSize: 12 }}>{label}</Text>
    </GlassCard>
  );
}

export function Center({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>{children}</View>;
}
