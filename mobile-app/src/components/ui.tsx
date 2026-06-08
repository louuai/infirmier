import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const inner = scroll ? (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>{children}</ScrollView>
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
  return <View className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${className}`}>{children}</View>;
}

export function Button({ title, onPress, loading, variant = "primary" }: { title: string; onPress: () => void; loading?: boolean; variant?: "primary" | "ghost" | "danger" }) {
  const base = "rounded-full px-5 py-3 items-center";
  const styles =
    variant === "primary" ? "bg-emerald-500" : variant === "danger" ? "bg-rose-500" : "border border-white/15";
  return (
    <Pressable onPress={onPress} disabled={loading} className={`${base} ${styles} ${loading ? "opacity-60" : ""}`}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text className="font-semibold text-white">{title}</Text>}
    </Pressable>
  );
}

export function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs text-slate-400">{label}</Text>
      <TextInput
        placeholderTextColor="#64748b"
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white"
        {...props}
      />
    </View>
  );
}

export function Badge({ text, tone = "default" }: { text: string; tone?: "default" | "success" | "warning" | "danger" }) {
  const c =
    tone === "success" ? "bg-emerald-500/20 text-emerald-300" :
    tone === "warning" ? "bg-amber-500/20 text-amber-300" :
    tone === "danger" ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-slate-300";
  return <Text className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}>{text}</Text>;
}

export function Center({ children }: { children: ReactNode }) {
  return <View className="flex-1 items-center justify-center p-8">{children}</View>;
}
