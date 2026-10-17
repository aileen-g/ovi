import { useCallback, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import { api, C } from "../../lib/api";

export default function Analysis() {
  const [a, setA] = useState<any>(null);
  useFocusEffect(useCallback(() => { api.analysis().then(setA).catch(() => {}); }, []));
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 34, fontWeight: "700", color: C.brown }}>Analysis</Text>
      {a && (<>
        <Text style={{ color: C.brown, marginTop: 8 }}>{a.summary}</Text>
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
