import { useCallback, useState } from "react";
import { View, Text, ScrollView, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, C } from "../../lib/api";

const DARK = "#A14F4F";   // colour of the most recent (last) bar
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, serif" });
const SHOW = 6;           // how many bars to show

// "27–29" (or just "28" if every value is the same)
const range = (xs: number[]) => {
  const lo = Math.min(...xs), hi = Math.max(...xs);
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
};

function Stat({ label, v }: { label: string; v: number | null }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 24, padding: 20 }}>
      <Text style={{ fontSize: 16, color: C.grey }}>{label}</Text>
      <Text style={{ fontSize: 38, fontWeight: "700", color: C.brown, marginTop: 4 }}>
        {v ?? "–"} <Text style={{ fontSize: 16, fontWeight: "400", color: C.grey }}>days</Text>
      </Text>
    </View>
  );
}

function Bars({ title, values, months, noun }: { title: string; values: number[]; months: string[]; noun: string }) {
  // only the most recent bars
  const vals = values.slice(-SHOW);
  const labels = months.slice(-SHOW);
  const max = Math.max(...vals, 1);
  return (
    <View style={{ backgroundColor: C.card, borderRadius: 24, padding: 20, marginTop: 16 }}>
      {/* Title on the left, "2026 · days" on the right */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: C.brown, fontFamily: SERIF }}>{title}</Text>
        <Text style={{ fontSize: 14, color: C.grey }}>{new Date().getFullYear()} · days</Text>
      </View>

      {vals.length === 0 ? (
        <Text style={{ color: C.grey, marginTop: 16 }}>Log a couple of periods to see this chart.</Text>
      ) : (
        <>
          {/* Bars: number on top, month underneath */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 20 }}>
            {vals.map((v, i) => {
              const last = i === vals.length - 1;
              return (
                <View key={i} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 14, marginBottom: 6, color: last ? DARK : C.grey }}>{v}</Text>
                  <View style={{ width: 36, height: (v / max) * 100, backgroundColor: last ? DARK : C.pink, borderRadius: 8 }} />
                  <Text style={{ fontSize: 13, color: C.grey, marginTop: 8 }}>{labels[i] ?? ""}</Text>
                </View>
              );
            })}
          </View>

          {/* Divider line + summary sentence */}
          <View style={{ height: 1, backgroundColor: "#EEEEEE", marginTop: 16 }} />
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
            <Ionicons name="stats-chart-outline" size={18} color={C.grey} />
            <Text style={{ marginLeft: 10, color: C.grey, fontSize: 15, flexShrink: 1 }}>
              Your recent {noun} ranged from {range(vals)} days.
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

export default function History() {
  const [d, setD] = useState<any>(null);
  useFocusEffect(useCallback(() => { api.history().then(setD).catch(() => {}); }, []));
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 34, fontWeight: "700", fontFamily: SERIF, color: C.brown }}>Past cycles</Text>
      {d && (<>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <Stat label="Average cycle" v={d.avg_cycle} />
          <Stat label="Average period" v={d.avg_period} />
        </View>
        <Bars title="Cycle length" values={d.cycle_lengths} months={d.cycle_months ?? []} noun="cycles" />
        <Bars title="Period length" values={d.period_lengths} months={d.period_months ?? []} noun="periods" />
      </>)}
    </ScrollView>
  );
}
