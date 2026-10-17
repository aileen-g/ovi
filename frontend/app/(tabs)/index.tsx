import { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { api, iso, C, Log } from "../../lib/api";

const PHRASES = ["Hi! I'm Eggbert. How are you feeling today?", "Remember to drink some water!", "Your rhythm is unique, and that's okay."];

export default function Home() {
  const [logs, setLogs] = useState<Record<string, Log>>({});
  const [predicted, setPredicted] = useState<string[]>([]);
  const [phrase] = useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)]);
  const [month, setMonth] = useState(new Date());

  useFocusEffect(useCallback(() => {
    api.logs().then(setLogs).catch(() => {});
    api.insights().then((i) => setPredicted(i.predicted_days)).catch(() => {});
  }, []));

  const y = month.getFullYear(), m = month.getMonth();
  const blanks = new Array(new Date(y, m, 1).getDay()).fill(null);
  const days = Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => new Date(y, m, i + 1));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 34, fontWeight: "700", color: C.brown }}>Welcome</Text>
      <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 16, marginTop: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 22, fontWeight: "600", color: C.brown }}>{month.toLocaleString("en", { month: "long", year: "numeric" })}</Text>
          <Text style={{ fontSize: 22 }} onPress={() => setMonth(new Date(y, m - 1, 1))}>‹   <Text onPress={() => setMonth(new Date(y, m + 1, 1))}>›</Text></Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
          {"SMTWTFS".split("").map((d, i) => <Text key={i} style={{ width: "14.28%", textAlign: "center", color: C.grey }}>{d}</Text>)}
          {[...blanks, ...days].map((d, i) => {
            if (!d) return <View key={i} style={{ width: "14.28%", height: 44 }} />;
            const key = iso(d);
            const isPeriod = logs[key] && logs[key].flow !== "none";
            const isToday = key === iso(new Date());
            return (
              <Pressable key={i} style={{ width: "14.28%", height: 44, alignItems: "center", justifyContent: "center" }}
                onPress={() => router.push({ pathname: "/log", params: { date: key } })}>
                <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
                  backgroundColor: isPeriod ? C.pink : isToday ? C.yellow : "transparent",
                  borderWidth: predicted.includes(key) ? 1 : 0, borderStyle: "dashed", borderColor: "#C76B7A" }}>
                  <Text style={{ color: C.brown }}>{d.getDate()}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      {/* Mascot: swap the emoji for <Image source={require("../../assets/egg.png")} /> once your art is ready */}
      <View style={{ alignItems: "center", marginTop: 30 }}>
        <View style={{ backgroundColor: C.card, padding: 14, borderRadius: 16 }}><Text style={{ color: C.brown }}>{phrase}</Text></View>
        <Text style={{ fontSize: 80 }}>🥚</Text>
      </View>
    </ScrollView>
  );
}
