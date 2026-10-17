import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { api, C } from "../../lib/api";

export default function Analysis() {
  const [a, setA] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    api.analysis().then(setA).catch(() => {}).finally(() => setLoading(false));
  }, []));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 34, fontWeight: "700", color: C.brown }}>Analysis</Text>

      {loading && !a && (
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <ActivityIndicator color={C.brown} />
          <Text style={{ color: C.grey, marginTop: 8 }}>Reading your logs...</Text>
        </View>
      )}

      {a && (<>
        <Text style={{ color: C.brown, marginTop: 8 }}>{a.summary}</Text>

        {/* The AI-written summary from Gemini (only shows if the backend returned one) */}
        {a.ai_summary && (
          <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, marginTop: 12, borderLeftWidth: 5, borderLeftColor: C.pink }}>
            <Text style={{ fontWeight: "600", color: C.brown }}>Your personal summary</Text>
            <Text style={{ marginTop: 6, lineHeight: 22, color: C.brown }}>{a.ai_summary}</Text>
            <Text style={{ marginTop: 8, fontSize: 11, color: C.grey }}>Written by AI from your logs</Text>
          </View>
        )}

        {a.findings.map((f: any, i: number) => (
          <View key={i} style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, marginTop: 12, borderLeftWidth: 5, borderLeftColor: f.level === "watch" ? "#C76B7A" : C.yellow }}>
            <Text style={{ fontWeight: "600", color: C.brown }}>{f.title}</Text>
            <Text style={{ marginTop: 4 }}>{f.detail}</Text>
          </View>
        ))}
        <Text style={{ color: C.grey, marginTop: 20, fontSize: 12 }}>{a.disclaimer}</Text>
      </>)}
    </ScrollView>
  );
}
