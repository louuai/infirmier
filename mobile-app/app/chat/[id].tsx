import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatBox } from "@/components/chat-box";

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#03040d" }}>
      <ChatBox conversationId={id} />
    </SafeAreaView>
  );
}
