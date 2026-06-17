import { Redirect } from "expo-router";
import { useAuth } from "@/store/auth";

export default function Index() {
  const user = useAuth((s) => s.user);
  // Invité (sans compte) → landing + recherche libre
  if (!user) return <Redirect href="/(public)/landing" />;
  if (user.role === "ADMIN") return <Redirect href="/(admin)" />;
  if (user.role === "NURSE") return <Redirect href="/(nurse)" />;
  return <Redirect href="/(client)" />;
}
