import { View, Text, ScrollView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../lib/api";

const MUTED = "#7B6F73";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, serif" });

// Placeholder cards. Swap these for real data later (title, value, unit, note).
const REPORTS = [
  { title: "Blood Flow Report", value: "–", unit: "days", note: "6 completed cycles" },
  { title: "Blood Flow Report", value: "–", unit: "days", note: "6 completed cycles" },
  { title: "Blood Flow Report", value: "–", unit: "days", note: "6 completed cycles" },
  { title: "Blood Flow Report", value: "–", unit: "days", note: "6 completed cycles" },
  { title: "Blood Flow Report", value: "–", unit: "days", note: "6 completed cycles" },
  { title: "Blood Flow Report", value: "–", unit: "days", note: "6 completed cycles" },
];

export default function Info() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}>
      <Text style={{ fontSize: 34, fontWeight: "700", color: C.brown, fontFamily: SERIF, marginTop: 8, marginBottom: 16 }}>
        General Information
      </Text>

      {REPORTS.map((r, i) => (
        <View key={i} style={{ backgroundColor: C.card, borderRadius: 20, paddingVertical: 18, paddingHorizontal: 20, marginBottom: 8 }}>
          <Text style={{ fontSize: 16, color: MUTED }}>{r.title}</Text>
          <Text style={{ fontSize: 18, color: MUTED, marginTop: 8 }}>{r.value} {r.unit}</Text>
          <Text style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>{r.note}</Text>
        </View>
      ))}

      <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 12 }}>
        <Ionicons name="information-circle-outline" size={18} color={MUTED} style={{ marginTop: 2 }} />
        <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, lineHeight: 21, color: MUTED }}>
          These are basic summaries of conditions. Do not use this to diagnose yourself. Seek a certified healthcare provider for major concerns.
        </Text>
      </View>
    </ScrollView>
  );
}
