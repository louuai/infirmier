import { useEffect, useState } from "react";
import { View, Text, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Card, Muted, Button, Badge, FadeIn, Press, SectionLabel } from "@/components/ui";
import { api } from "@/api/client";
import { theme, grad } from "@/theme";

const PLANS = [
  { key: "MONTHLY", label: "Mensuel", price: 50, per: "/ mois", tag: "" },
  { key: "ANNUAL", label: "Annuel", price: 500, per: "/ an", tag: "2 mois offerts" },
];

export default function Subscription() {
  const router = useRouter();
  const [access, setAccess] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("ANNUAL");
  const [sending, setSending] = useState(false);

  async function load() {
    try { const d = await api("/api/nurses/me"); setAccess(d.data.access); } catch {} finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function request() {
    setSending(true);
    try {
      await api("/api/subscriptions", { method: "POST", body: { plan } });
      Alert.alert("Demande envoyée ✅", "Votre demande d'abonnement a été transmise. L'administrateur l'activera très vite. (Paiement en ligne bientôt disponible.)");
      load();
    } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setSending(false); }
  }

  if (loading) return <Screen><ActivityIndicator color={theme.teal} /></Screen>;

  const expires = access?.expiresAt ? new Date(access.expiresAt).toLocaleDateString("fr-FR") : null;

  return (
    <Screen>
      <Press onPress={() => router.back()}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 }}>
          <Ionicons name="chevron-back" size={20} color={theme.textDim} />
          <Text style={{ color: theme.textDim }}>Retour</Text>
        </View>
      </Press>

      <Text style={{ color: theme.text, fontSize: 26, fontWeight: "800" }}>Abonnement</Text>
      <Muted>Accédez aux missions et développez votre activité.</Muted>
      <View style={{ height: 16 }} />

      {/* statut actuel */}
      <FadeIn>
        <Card glow={access?.active}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: access?.active ? "rgba(47,224,166,0.18)" : "rgba(251,113,133,0.18)" }}>
              <Ionicons name={access?.active ? "shield-checkmark" : "lock-closed"} size={24} color={access?.active ? theme.teal : theme.rose} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>
                  {access?.subActive ? "Abonné" : access?.trialActive ? "Essai gratuit" : "Inactif"}
                </Text>
                {access?.trialActive && <Badge text={`${access.daysLeft} j restants`} tone="warning" />}
                {access?.subActive && <Badge text="Actif" tone="success" />}
              </View>
              <Muted>{expires ? `Valable jusqu'au ${expires}` : "Aucun abonnement actif"}</Muted>
            </View>
          </View>
        </Card>
      </FadeIn>

      <View style={{ height: 18 }} />
      <SectionLabel>Choisissez une formule</SectionLabel>
      {PLANS.map((p, i) => {
        const on = plan === p.key;
        return (
          <FadeIn key={p.key} delay={i * 80}>
            <Press onPress={() => setPlan(p.key)} style={{ marginBottom: 12 }}>
              <View style={{ borderRadius: 20, overflow: "hidden", borderWidth: 1.5, borderColor: on ? theme.teal : theme.border }}>
                <LinearGradient colors={on ? ["rgba(47,224,166,0.16)", "rgba(56,189,248,0.05)"] : grad.glass} style={{ padding: 18, flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: on ? theme.teal : theme.textFaint, alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                    {on && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.teal }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ color: theme.text, fontWeight: "800", fontSize: 16 }}>{p.label}</Text>
                      {p.tag ? <Badge text={p.tag} tone="success" /> : null}
                    </View>
                    <Muted>Accès complet aux missions, suivi, chat.</Muted>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: theme.text, fontWeight: "800", fontSize: 20 }}>{p.price}</Text>
                    <Text style={{ color: theme.textFaint, fontSize: 11 }}>TND {p.per}</Text>
                  </View>
                </LinearGradient>
              </View>
            </Press>
          </FadeIn>
        );
      })}

      <View style={{ height: 6 }} />
      <Button title={sending ? "Envoi…" : "Demander l'activation"} icon="card" onPress={request} loading={sending} />
      <View style={{ height: 10 }} />
      <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
        <Ionicons name="information-circle" size={16} color={theme.textFaint} />
        <Text style={{ color: theme.textFaint, fontSize: 12, flex: 1 }}>
          Paiement en ligne (Flouci/Konnect) bientôt disponible. En attendant, l'administrateur active votre abonnement après votre demande.
        </Text>
      </View>
    </Screen>
  );
}
