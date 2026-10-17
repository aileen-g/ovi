import { useCallback, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import { api, C } from "../../lib/api";

function Bars({ title, values }: { title: string; values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, marginTop: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", color: C.brown }}>{title}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: 120, marginTop: 12 }}>
        {values.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 12 }}>{v}</Text>
            <View style={{ width: 24, height: (v / max) * 90, backgroundColor: i === values.length - 1 ? "#6F4B6B" : C.pink, borderRadius: 4 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function Insights() {
  const [d, setD] = useState<any>(null);
  useFocusEffect(useCallback(() => { api.insights().then(setD).catch(() => {}); }, []));
  const Stat = ({ label, v }: { label: string; v: number | null }) => (
    <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 16, margin: 4 }}>
      <Text style={{ color: C.grey }}>{label}</Text>
      <Text style={{ fontSize: 32, fontWeight: "700", color: C.brown }}>{v ?? "–"} <Text style={{ fontSize: 14 }}>days</Text></Text>
    </View>
  );
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 34, fontWeight: "700", color: C.brown }}>Past cycles</Text>
      {d && (<>
        <View style={{ flexDirection: "row", marginTop: 16 }}><Stat label="Average cycle" v={d.avg_cycle} /><Stat label="Average period" v={d.avg_period} /></View>
        <Bars title="Cycle length" values={d.cycle_lengths} />
        <Bars title="Period length" values={d.period_lengths} />
      </>)}
    </ScrollView>
  );
}
