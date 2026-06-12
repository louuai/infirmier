import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/store/auth";
import { Avatar } from "@/components/ui";

export function Topbar({ title }: { title: string }) {
  const router = useRouter();
  const logout = useAuth((s) => s.logout);
  const user = useAuth((s) => s.user);
  return (
    <View className="mb-5 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        {user && <Avatar name={`${user.firstName} ${user.lastName}`} size={42} />}
        <View>
          <Text className="text-xl font-extrabold text-white">{title}</Text>
          {user && <Text className="text-xs text-slate-500">{user.firstName} · {user.role}</Text>}
        </View>
      </View>
      <Pressable
        onPress={async () => { await logout(); router.replace("/login"); }}
        className="size-10 items-center justify-center rounded-full border border-white/15"
      >
        <Ionicons name="log-out-outline" size={20} color="#94a3b8" />
      </Pressable>
    </View>
  );
}
