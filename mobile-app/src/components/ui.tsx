import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const inner = scroll ? (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, padding: 16 }}>{children}</View>
  );
  return <SafeAreaView style={{ flex: 1, backgroundColor: "#03040d" }}>{inner}</SafeAreaView>;
}

export function H1({ children }: { children: ReactNode }) {
  return <Text className="mb-1 text-2xl font-extrabold text-white">{children}</Text>;
}
export function Muted({ children }: { children: ReactNode }) {
  return <Text className="text-sm text-slate-400">{children}</Text>;
}
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <View
      className={`rounded-2xl border border-white/10 bg-white/[0.06] p-4 ${className}`}
      style={{ shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}
    >
      {children}
    </View>
  );
}

type IconName = keyof typeof Ionicons.glyphMap;

export function Button({ title, onPress, loading, variant = "primary", icon }: { title: string; onPress: () => void; loading?: boolean; variant?: "primary" | "ghost" | "danger"; icon?: IconName }) {
  const bg = variant === "primary" ? "#10b981" : variant === "danger" ? "#fb7185" : "transparent";
  const border = variant === "ghost" ? "rgba(255,255,255,0.15)" : "transparent";
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      android_ripple={{ color: "rgba(255,255,255,0.15)", borderless: false }}
      style={({ pressed }) => ({
        backgroundColor: bg, borderColor: border, borderWidth: variant === "ghost" ? 1 : 0,
        borderRadius: 999, paddingVertical: 13, paddingHorizontal: 20,
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        opacity: loading ? 0.6 : pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        shadowColor: variant === "primary" ? "#10b981" : "#000",
        shadowOpacity: variant === "primary" ? 0.4 : 0, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
      })}
    >
      {loading ? <ActivityIndicator color="#fff" /> : (
        <>
          {icon && <Ionicons name={icon} size={18} color="#fff" />}
          <Text className="font-bold text-white">{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({ label, icon, ...props }: { label: string; icon?: IconName } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-medium text-slate-400">{label}</Text>
      <View className="flex-row items-center rounded-xl border border-white/10 bg-white/5 px-3">
        {icon && <Ionicons name={icon} size={18} color="#64748b" style={{ marginRight: 8 }} />}
        <TextInput placeholderTextColor="#64748b" className="flex-1 py-3 text-white" {...props} />
      </View>
    </View>
  );
}

export function Badge({ text, tone = "default" }: { text: string; tone?: "default" | "success" | "warning" | "danger" }) {
  const c =
    tone === "success" ? "bg-emerald-500/20 text-emerald-300" :
    tone === "warning" ? "bg-amber-500/20 text-amber-300" :
    tone === "danger" ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-slate-300";
  return <Text className={`overflow-hidden rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}>{text}</Text>;
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "rgba(47,224,166,0.18)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
      <Text style={{ color: "#fff", fontWeight: "700", fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export function Center({ children }: { children: ReactNode }) {
  return <View className="flex-1 items-center justify-center p-8">{children}</View>;
}
