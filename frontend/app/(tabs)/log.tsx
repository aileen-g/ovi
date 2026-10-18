import { useEffect, useState } from "react";
import { View, Text, Platform, TextInput, Pressable, ScrollView, Alert, Image, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api, iso, C } from "../../lib/api";

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, serif" });


const FLOW = ["none", "light", "medium", "heavy"];
// Same mood names as before (so saved data and insights don't change), each with its egg picture.
// Images live in frontend/assets/images/
const MOODS: { value: string; img: any }[] = [
  { value: "low",       img: require("../../assets/images/eggs/egg_low.png") },
  { value: "sensitive", img: require("../../assets/images/eggs/egg_sensitive.png") },
  { value: "calm",      img: require("../../assets/images/eggs/egg_calm.png") },
  { value: "happy",     img: require("../../assets/images/eggs/egg_happy.png") },
  { value: "anxious",   img: require("../../assets/images/eggs/egg_anxious.png") },
];
const SYMPTOMS = ["Mild cramps", "Heavy cramps", "Headache", "Bloating", "Pelvic pain", "Pain during sex"];

const PAGE_PAD = 20;   // page side padding (see contentContainerStyle below)
const BOX_PAD = 8;     // padding inside each rounded box
const MOOD_PINK = "#FFEAEA"; // the eggs are white, so the mood box is pale pink instead of white

// Section title on the left, small hint on the right (e.g. "Choose one")
function SectionLabel({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 18, marginBottom: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: C.grey }}>{title}</Text>
      {hint ? <Text style={{ fontSize: 13, color: C.brown }}>{hint}</Text> : null}
    </View>
  );
}

// One option inside the big white PERIOD FLOW box. Selected = yellow with darker bold text.
function FlowOption({ label, on, onPress, width }: { label: string; on: boolean; onPress: () => void; width: number }) {
  return (
    <Pressable onPress={onPress} style={{ width }}>
      <View style={{ width, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: on ? C.yellow : "transparent" }}>
        <Text style={{ fontSize: 16, textTransform: "capitalize", fontWeight: on ? "700" : "400", color: on ? C.brown : C.grey }}>{label}</Text>
      </View>
    </Pressable>
  );
}

// One egg inside the pink MOOD box. Selected = yellow with darker bold text.
function MoodTile({ label, img, on, onPress, size }: { label: string; img: any; on: boolean; onPress: () => void; size: number }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={{ width: size }}>
      <View style={{ width: size, paddingVertical: 8, borderRadius: 12, alignItems: "center", backgroundColor: on ? C.yellow : "transparent" }}>
        <Image source={img} resizeMode="contain" style={{ width: size - 16, height: size - 16 }} />
        <Text numberOfLines={1} adjustsFontSizeToFit
          style={{ fontSize: 11, marginTop: 4, textTransform: "capitalize", fontWeight: on ? "700" : "400", color: on ? C.brown : C.grey }}>{label}</Text>
      </View>
    </Pressable>
  );
}

// One symptom. Not selected = light blue with "+". Selected = yellow with a check.
function SymptomChip({ label, on, onPress, width }: { label: string; on: boolean; onPress: () => void; width: number }) {
  return (
    <Pressable onPress={onPress} style={{ width, marginBottom: 8 }}>
      <View style={{ width, flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
        backgroundColor: on ? C.yellow : C.bg }}>
        <Text style={{ fontSize: 16, marginRight: 10, color: on ? C.brown : C.grey }}>{on ? "✓" : "+"}</Text>
        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: on ? "600" : "400", color: on ? C.brown : C.grey }}>{label}</Text>
      </View>
    </Pressable>
  );
}

export default function DailyLog() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const day = date ?? iso(new Date());
  const [flow, setFlow] = useState("none");
  const [mood, setMood] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Sizes are worked out in pixels from the screen width so the layouts can't collapse.
  const { width } = useWindowDimensions();
  const inner = width - PAGE_PAD * 2 - BOX_PAD * 2;      // space inside a rounded box
  const flowW = Math.floor(inner / 4);                   // 4 flow options side by side
  const moodW = Math.floor((inner - 4 * 4) / 5);         // 5 eggs side by side, 4px gaps
  const symW = Math.floor((inner - 8) / 2);              // 2 symptom columns, 8px gap

  useEffect(() => { // load existing entry for this day
    api.logs().then((all) => {
      const l = all[day];
      setFlow(l?.flow ?? "none"); setMood(l?.mood ?? null); setSymptoms(l?.symptoms ?? []); setNotes(l?.notes ?? "");
    }).catch(() => {});
  }, [day]);

  const toggle = (s: string) => setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const box = { borderRadius: 16, padding: BOX_PAD };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: PAGE_PAD, paddingTop: 60 }}>
      <Text style={{ fontSize: 34, fontWeight: "700", color: C.brown, fontFamily: SERIF }}>Daily log</Text>
      <Text style={{ color: C.brown, marginTop: 6 }}>{day}</Text>

      <SectionLabel title="PERIOD FLOW" />
      <View style={{ ...box, backgroundColor: C.card, flexDirection: "row" }}>
        {FLOW.map((f) => <FlowOption key={f} label={f} width={flowW} on={flow === f} onPress={() => setFlow(f)} />)}
      </View>

      <SectionLabel title="MOOD" hint="Choose one" />
      <View style={{ ...box, backgroundColor: MOOD_PINK, flexDirection: "row", justifyContent: "space-between" }}>
        {MOODS.map((x) => <MoodTile key={x.value} label={x.value} img={x.img} size={moodW} on={mood === x.value} onPress={() => setMood(x.value)} />)}
      </View>


      {flow !== "none" && (
        <>
          <SectionLabel title="SYMPTOMS" hint="Select all that apply" />
          <View style={{ ...box, paddingBottom: 0, backgroundColor: C.card, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {SYMPTOMS.map((s) => <SymptomChip key={s} label={s} width={symW} on={symptoms.includes(s)} onPress={() => toggle(s)} />)}
          </View>
        </>
      )}

      <SectionLabel title="NOTES" hint="Optional" />
      <TextInput multiline value={notes} onChangeText={setNotes} placeholder="Anything else?"
        style={{ backgroundColor: C.card, borderRadius: 16, padding: 14, minHeight: 90, color: C.brown, textAlignVertical: "top" }} />

      <Pressable style={{ backgroundColor: C.brown, padding: 16, borderRadius: 14, marginTop: 24, alignItems: "center" }}
        onPress={async () => { await api.save(day, { flow, mood, symptoms, notes }); Alert.alert("Saved", "Check-in saved."); }}>
        <Text style={{ color: "white", fontWeight: "600" }}>Save check-in</Text>
      </Pressable>
      <Text style={{ color: C.grey, fontSize: 12, textAlign: "center", marginTop: 16, lineHeight: 18 }}>
        Log as much or as little as you like.{"\n"}You can edit your check-in anytime.
      </Text>
    </ScrollView>
  );
}
