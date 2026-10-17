import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { api, iso, C } from "../../lib/api";

const FLOW = ["none", "light", "medium", "heavy"];
const MOODS = ["low", "sensitive", "calm", "happy", "anxious"];
const SYMPTOMS = ["Mild cramps", "Tender breasts", "Headache", "Bloating"];

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ padding: 10, borderRadius: 10, margin: 4, backgroundColor: on ? C.yellow : C.card }}>
      <Text style={{ color: C.brown, textTransform: "capitalize" }}>{label}</Text>
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

  useEffect(() => { // load existing entry for this day
    api.logs().then((all) => {
      const l = all[day];
      setFlow(l?.flow ?? "none"); setMood(l?.mood ?? null); setSymptoms(l?.symptoms ?? []); setNotes(l?.notes ?? "");
    }).catch(() => {});
  }, [day]);

  const toggle = (s: string) => setSymptoms((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const label = { fontSize: 13, color: C.grey, marginTop: 18, marginBottom: 6 };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 34, fontWeight: "700", color: C.brown }}>Daily log</Text>
      <Text style={{ color: C.brown, marginTop: 6 }}>{day}</Text>
      <Text style={label}>PERIOD FLOW</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>{FLOW.map((f) => <Chip key={f} label={f} on={flow === f} onPress={() => setFlow(f)} />)}</View>
      <Text style={label}>MOOD</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>{MOODS.map((x) => <Chip key={x} label={x} on={mood === x} onPress={() => setMood(x)} />)}</View>
      <Text style={label}>SYMPTOMS</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>{SYMPTOMS.map((s) => <Chip key={s} label={s} on={symptoms.includes(s)} onPress={() => toggle(s)} />)}</View>
      <Text style={label}>NOTES</Text>
      <TextInput multiline value={notes} onChangeText={setNotes} placeholder="Anything else?"
        style={{ backgroundColor: C.card, borderRadius: 12, padding: 14, minHeight: 90 }} />
      <Pressable style={{ backgroundColor: C.brown, padding: 16, borderRadius: 14, marginTop: 24, alignItems: "center" }}
        onPress={async () => { await api.save(day, { flow, mood, symptoms, notes }); Alert.alert("Saved", "Check-in saved."); }}>
        <Text style={{ color: "white", fontWeight: "600" }}>Save check-in</Text>
      </Pressable>
    </ScrollView>
  );
}
