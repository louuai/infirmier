import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { api } from "@/api/client";

interface Msg {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string };
}

export function ChatBox({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [meId, setMeId] = useState("");
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<Msg>>(null);

  const load = useCallback(async () => {
    try {
      const d = await api(`/api/conversations/${conversationId}/messages`);
      setMessages(d.data.messages);
      setMeId(d.data.meId);
    } catch {}
  }, [conversationId]);

  useEffect(() => {
    load();
    const i = setInterval(load, 4000);
    return () => clearInterval(i);
  }, [load]);

  async function send() {
    if (!text.trim()) return;
    const body = text;
    setText("");
    try {
      await api(`/api/conversations/${conversationId}/messages`, { method: "POST", body: { body } });
    } catch {}
    load();
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.sender.id === meId;
          return (
            <View
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "80%",
                backgroundColor: mine ? "#10b981" : "rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: 10,
              }}
            >
              {!mine && (
                <Text style={{ color: "#7dd3fc", fontSize: 11, fontWeight: "700", marginBottom: 2 }}>
                  {item.sender.firstName}
                </Text>
              )}
              <Text style={{ color: "#fff" }}>{item.body}</Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={{ color: "#64748b", textAlign: "center", marginTop: 40 }}>
            Démarrez la conversation…
          </Text>
        }
      />
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          padding: 10,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.1)",
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message…"
          placeholderTextColor="#64748b"
          style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 999,
            paddingHorizontal: 16,
            color: "#fff",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
          }}
        />
        <Pressable
          onPress={send}
          style={{ backgroundColor: "#10b981", borderRadius: 999, paddingHorizontal: 18, justifyContent: "center" }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>↑</Text>
        </Pressable>
      </View>
    </View>
  );
}
