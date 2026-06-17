import { Stack } from "expo-router";

export default function PublicLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#03040d" } }} />;
}
