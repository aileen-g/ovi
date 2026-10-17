import { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { api, iso, C, Log, PhaseData, PHASES, PHASE_ORDER } from "../../lib/api";

const PHRASES = ["Hi! I'm Eggbert. How are you feeling today?", "Remember to drink some water!", "Your rhythm is unique, and that's okay."];

export default function Home() {
  const [logs, setLogs] = useState<Record<string, Log>>({});
  const [predicted, setPredicted] = useState<string[]>([]);
  const [phrase] = useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)]);
  const [month, setMonth] = useState(new Date());
  const [showPhases, setShowPhases] = useState(false); // off by default: the calendar opens with the plain period circles
  const [phaseData, setPhaseData] = useState<PhaseData | null>(null);

  useFocusEffect(useCallback(() => {
    api.logs().then(setLogs).catch(() => {});
    api.insights().then((i) => setPredicted(i.predicted_days)).catch(() => {});
    api.phases().then(setPhaseData).catch(() => {});
  }, []));

  const y = month.getFullYear(), m = month.getMonth();
  const blanks = new Array(new Date(y, m, 1).getDay()).fill(null);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(y, m, i + 1));
  const phases = phaseData?.days ?? {};

  return (
  <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        <Text style={{ fontSize: 34, fontWeight: "700", color: C.brown }}>Welcome</Text>
        <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, marginTop: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", flexShrink: 1, flexWrap: "wrap" }}>
              <Text style={{ fontSize: 22, fontWeight: "600", color: C.brown }}>{month.toLocaleString("en", { month: "long", year: "numeric" })}</Text>
              <Pressable onPress={() => setShowPhases((v) => !v)}
                style={{ marginLeft: 10, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, borderColor: C.brown,
                  backgroundColor: showPhases ? C.brown : "transparent" }}>
                <Text style={{ color: showPhases ? "#FFFFFF" : C.brown, fontWeight: "600", fontSize: 12 }}>{showPhases ? "Hide Phases" : "Show Phases"}</Text>
              </Pressable>
            </View>
            <Text style={{ fontSize: 22 }} onPress={() => setMonth(new Date(y, m - 1, 1))}>‹   <Text onPress={() => setMonth(new Date(y, m + 1, 1))}>›</Text></Text>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
            {"SMTWTFS".split("").map((d, i) => <Text key={i} style={{ width: "14.28%", textAlign: "center", color: C.grey }}>{d}</Text>)}
            {[...blanks, ...days].map((d, i) => {
              if (!d) return <View key={i} style={{ width: "14.28%", height: 44 }} />;
              const key = iso(d);
              // Phases off: logged period days are pink circles (as before). Phases on: the highlight replaces them.
              const isPeriod = !showPhases && logs[key] && logs[key].flow !== "none";
              const isToday = key === iso(new Date());
              const phase = showPhases ? phases[key] : undefined;
              const date = d.getDate();
              const col = i % 7; // 0 = Sunday column, 6 = Saturday column
              // Join the highlight to its neighbour when the next/previous day (same week row) is in the same phase,
              // so a phase looks like one continuous band with rounded ends.
              const joinL = !!phase && col > 0 && date > 1 && phases[iso(new Date(y, m, date - 1))] === phase;
              const joinR = !!phase && col < 6 && date < daysInMonth && phases[iso(new Date(y, m, date + 1))] === phase;
              return (
                <Pressable key={i} style={{ width: "14.28%", height: 44, alignItems: "center", justifyContent: "center" }}
                  onPress={() => router.push({ pathname: "/log", params: { date: key } })}>
                  {phase && (
                    <View style={{ position: "absolute", top: 4, bottom: 4, left: 0, right: 0, backgroundColor: PHASES[phase].color,
                      borderTopLeftRadius: joinL ? 0 : 18, borderBottomLeftRadius: joinL ? 0 : 18,
                      borderTopRightRadius: joinR ? 0 : 18, borderBottomRightRadius: joinR ? 0 : 18 }} />
                  )}
                  <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
                    backgroundColor: isPeriod ? C.pink : isToday ? C.yellow : "transparent",
                    borderWidth: isToday ? 2 : predicted.includes(key) ? 1 : 0,
                    borderStyle: isToday ? "solid" : "dashed",
                    borderColor: isToday ? "#C9A227" : "#C76B7A" }}>
                    <Text style={{ color: C.brown }}>{d.getDate()}</Text>
                  </View>
                </Pressable>
              );
            })}
        </View>
        {showPhases && (
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {PHASE_ORDER.map((p) => (
                <View key={p} style={{ flexDirection: "row", alignItems: "center", marginRight: 14, marginBottom: 4 }}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: PHASES[p].color, marginRight: 6 }} />
                  <Text style={{ color: C.brown, fontSize: 12 }}>{PHASES[p].label}</Text>
                </View>
              ))}
            </View>
            {phaseData?.estimated && (
              <Text style={{ color: C.grey, fontSize: 11, marginTop: 2 }}>
                Based on a typical {phaseData.cycle_length}-day cycle until you've logged a few more periods.
              </Text>
            )}
          </View>
        )}
      </View>
      {/* Mascot: swap the emoji for <Image source={require("../../assets/egg.png")} /> once your art is ready */}
      <View style={{ alignItems: "center", marginTop: 30 }}>
        <View style={{ backgroundColor: C.card, padding: 14, borderRadius: 16 }}><Text style={{ color: C.brown }}>{phrase}</Text></View>
        <Text style={{ fontSize: 80 }}>🥚</Text>
      </View>
    </ScrollView>
  );
}