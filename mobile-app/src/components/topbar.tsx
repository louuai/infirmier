import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/store/auth";

export function Topbar({ title }: { title: string }) {
  const router = useRouter();
  const logout = useAuth((s) => s.logout);
  const user = useAuth((s) => s.user);
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <View>
        <Text className="text-xl font-extrabold text-white">{title}</Text>
        {user && <Text className="text-xs text-slate-500">{user.firstName} · {user.role}</Text>}
      </View>
      <Pressable onPress={async () => { await logout(); router.replace("/login"); }} className="rounded-full border border-white/15 px-3 py-1.5">
        <Text className="text-xs text-slate-300">Déconnexion</Text>
      </Pressable>
    </View>
  );
}
