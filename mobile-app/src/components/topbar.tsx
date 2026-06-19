import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/store/auth";
import { Avatar, Press } from "@/components/ui";
import { theme } from "@/theme";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function Topbar({ title }: { title: string }) {
  const router = useRouter();
  const logout = useAuth((s) => s.logout);
  const user = useAuth((s) => s.user);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {user && <Avatar name={`${user.firstName} ${user.lastName}`} size={46} />}
        <View>
          {user && <Text style={{ color: theme.textFaint, fontSize: 12 }}>{greeting()},</Text>}
          <Text style={{ color: theme.text, fontSize: 19, fontWeight: "800" }}>{user ? user.firstName : title}</Text>
        </View>
      </View>
      <Press onPress={async () => { await logout(); router.replace("/(public)/landing"); }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border, backgroundColor: theme.glass }}>
          <Ionicons name="log-out-outline" size={20} color={theme.textDim} />
        </View>
      </Press>
    </View>
  );
}
