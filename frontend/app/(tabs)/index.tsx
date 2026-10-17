import { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { api, iso, C, Log, PhaseData, PhaseName, PHASES, PHASE_ORDER } from "../../lib/api";

// The egg has 4 moods. Put your 4 PNGs in frontend/assets/images/ with these names.
type Mood = "happy" | "moody" | "normal" | "smirk";
const EGGS: Record<Mood, any> = {
  happy:  require("../../assets/images/eggs/main_happy.png"),
  moody:  require("../../assets/images/eggs/main_moody.png"),
  normal: require("../../assets/images/eggs/main_normal.png"),
  smirk:  require("../../assets/images/eggs/main_smirk.png"),
};

// What the egg says, by phase, and which mood the egg is in while saying it. Tap the bubble to get another line.
const EGG_LINES: Record<PhaseName, { text: string; mood: Mood }[]> = {
  follicular: [
    { text: "You're officially in your follicular phase. Isn't that egg-citing?", mood: "happy" },
    { text: "New follicle, who dis?", mood: "smirk" },
    { text: "Your skin might be changing with your cycle. Any new developments in your shell?", mood: "normal" },
    { text: "Estrogen is rising, so is my egg-o.", mood: "smirk" },
    { text: "I'm putting the fun in follicular!", mood: "happy" },
  ],
  ovulation: [
    { text: "Guess who's ovary-achieving today? Yours truly.", mood: "smirk" },
    { text: "It's my time to shine. I'm literally the released egg.", mood: "happy" },
    { text: "I'm finally leaving the nest. The fallopian tube, actually.", mood: "normal" },
    { text: "Egg-cuse me, is that a little twinge? Some people feel mild ovulation pain!", mood: "moody" },
    { text: "Feeling a little bloated? Hormonal shifts can sometimes leave you feeling egg-stra full.", mood: "moody" },
  ],
  luteal: [
    { text: "Progesterone has entered the chat. Time to check in with your shell-f!", mood: "normal" },
    { text: "Feeling extra sensitive? No need to keep your feelings in a shell.", mood: "moody" },
    { text: "Your emotions aren't scrambled — but your hormones may be shifting!", mood: "normal" },
    { text: "Cravings knocking? Your appetite can change throughout your cycle.", mood: "moody" },
    { text: "Head feeling a little heavy? Headaches can happen for some people around hormonal shifts.", mood: "moody" },
  ],
  menstrual: [
    { text: "Low battery, bestie? No need to scramble to do everything.", mood: "smirk" },
    { text: "Hormones are shifting, but your feelings are still valid. How are you holding up?", mood: "normal" },
    { text: "Period? I hardly know her.", mood: "smirk" },
    { text: "One minute I'm sunny-side up, the next I'm scrambled.", mood: "moody" },
    { text: "Don't forget to check iron levels!", mood: "happy" },
  ],
};

export default function Home() {
  const [logs, setLogs] = useState<Record<string, Log>>({});
  const [predicted, setPredicted] = useState<string[]>([]);
  const [lineIdx, setLineIdx] = useState(() => Math.floor(Math.random() * 5)); // which egg line is showing
  const [month, setMonth] = useState(new Date());
  const [showPhases, setShowPhases] = useState(false); // off by default: the calendar opens with the plain period circles
  const [phaseData, setPhaseData] = useState<PhaseData | null>(null);

  useFocusEffect(useCallback(() => {
    api.logs().then(setLogs).catch(() => {});
    api.history().then((i) => setPredicted(i.predicted_days)).catch(() => {});
    api.phases().then(setPhaseData).catch(() => {});
  }, []));

  const y = month.getFullYear(), m = month.getMonth();
  const blanks = new Array(new Date(y, m, 1).getDay()).fill(null);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(y, m, i + 1));
  const phases = phaseData?.days ?? {};

  // Today's phase picks the heart colour and which set of lines the egg says.
  // If today has no phase yet (no periods logged), it falls back to follicular.
  const phaseToday: PhaseName = phases[iso(new Date())] ?? "follicular";
  const lines = EGG_LINES[phaseToday];
  const eggLine = lines[lineIdx % lines.length]; // the line on screen: its text AND the egg's mood
  // Tap = pick a random line that is NOT the one on screen (the egg picture changes with it)
  const nextLine = () => setLineIdx((cur) => {
    let n = cur % lines.length;
    while (lines.length > 1 && n === cur % lines.length) n = Math.floor(Math.random() * lines.length);
    return n;
  });

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
      {/* DAILY EGG-IN: header, check-in bubble, egg + chat bubble */}
      <Text style={{ fontSize: 14, fontWeight: "700", letterSpacing: 0.5, color: C.grey, marginTop: 30 }}>DAILY EGG-IN!</Text>

      {/* Bubble 1: tap anywhere = same as tapping today on the calendar */}
      <View style={{ marginTop: 12 }}>
        <Pressable onPress={() => router.push({ pathname: "/log", params: { date: iso(new Date()) } })}
          style={{ backgroundColor: C.card, borderRadius: 28, padding: 16, flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: PHASES[phaseToday].color, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 32, color: C.brown }}>♡</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: C.brown }}>How are you feeling today?</Text>
            <Text style={{ fontSize: 14, color: C.grey, marginTop: 2 }}>You're in your {phases[iso(new Date())] ? `${PHASES[phaseToday].label.toLowerCase()} phase.` : "Log a period to see your phase"}</Text>
          </View>
          <Text style={{ fontSize: 22, color: C.grey }}>›</Text>
        </Pressable>
        {/* The little triangle that turns the rounded box into a speech bubble (points down toward the egg) */}
        <View style={{ position: "absolute", left: 48, bottom: -17, width: 0, height: 0,
          borderTopWidth: 18, borderRightWidth: 26, borderTopColor: C.card, borderRightColor: "transparent" }} />
      </View>

      {/* Egg (bottom left) + bubble 2 (leaves room for the egg) */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}>
        <Image source={EGGS[eggLine.mood]} resizeMode="contain" style={{ width: 130, height: 160 }} />
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Pressable onPress={nextLine} style={{ backgroundColor: C.card, borderRadius: 24, padding: 18 }}>
            <Text style={{ fontSize: 17, lineHeight: 24, color: C.brown }}>{eggLine.text}</Text>
          </Pressable>
          {/* Triangle pointing left, toward the egg */}
          <View style={{ position: "absolute", left: -14, bottom: 26, width: 0, height: 0,
            borderTopWidth: 10, borderBottomWidth: 10, borderRightWidth: 16,
            borderTopColor: "transparent", borderBottomColor: "transparent", borderRightColor: C.card }} />
        </View>
      </View>
    </ScrollView>
  );
}