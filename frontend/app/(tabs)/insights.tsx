import { useCallback, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, TextInput, Platform, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { api, BASE, C } from "../../lib/api";
import { generateReport } from "../../lib/report";

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, serif" });

const YESNO: [string, string][] = [
  ["weight_gain", "Recent weight gain"],
  ["hair_growth", "Excess hair growth (face, chin, body)"],
  ["skin_darkening", "Dark skin patches (neck, underarms)"],
  ["hair_loss", "Hair thinning or loss"],
  ["pimples", "Acne"],
  ["fast_food", "Eat fast food often"],
  ["regular_exercise", "Exercise regularly"],
];

const LEVEL_TEXT: Record<string, string> = {
  lower: "Lower similarity",
  moderate: "Some similarity",
  higher: "Higher similarity",
};
const LEVEL_COLOR: Record<string, string> = { lower: "#9BC9A0", moderate: C.yellow, higher: "#C76B7A" };

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
      <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.brown, backgroundColor: on ? C.yellow : C.card, marginRight: 10 }} />
      <Text style={{ color: C.brown, flex: 1 }}>{label}</Text>
    </Pressable>
  );
}

const emptyForm: any = {
  age: "", height_cm: "", weight_kg: "",
  weight_gain: false, hair_growth: false, skin_darkening: false,
  hair_loss: false, pimples: false, fast_food: false, regular_exercise: false,
};

export default function Insights() {
  const [a, setA] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pcos, setPcos] = useState<any>(null);
  const [endo, setEndo] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [error, setError] = useState("");
  const [reporting, setReporting] = useState(false);

  const loadPcos = () =>
    fetch(`${BASE}/pcos`).then((r) => r.json()).then((p) => { setPcos(p); if (!p.ready) setShowForm(true); }).catch(() => {});

  useFocusEffect(useCallback(() => {
    setLoading(true);
    api.insights().then(setA).catch(() => {}).finally(() => setLoading(false));
    loadPcos();
    fetch(`${BASE}/endo`).then((r) => r.json()).then(setEndo).catch(() => {});
    fetch(`${BASE}/profile`).then((r) => r.json()).then((p) => {
      if (p && p.age) setForm({ ...p, age: String(p.age), height_cm: String(p.height_cm), weight_kg: String(p.weight_kg) });
    }).catch(() => {});
  }, []));

  const save = async () => {
    const age = parseInt(form.age), h = parseFloat(form.height_cm), w = parseFloat(form.weight_kg);
    if (!(age > 8 && age < 90) || !(h > 100 && h < 230) || !(w > 25 && w < 250)) {
      setError("Please enter a valid age, height (cm) and weight (kg).");
      return;
    }
    setError("");
    await fetch(`${BASE}/profile`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, age, height_cm: h, weight_kg: w }),
    });
    setShowForm(false);
    loadPcos();
  };

  // "Generate Report" button: builds the PDF (lib/report.ts) and opens the share / save sheet
  const makeReport = async () => {
    if (reporting) return;
    setReporting(true);
    try {
      await generateReport();
    } catch (e) {
      Alert.alert("Couldn't make the report", "Check that the app can reach the backend, then try again.");
    } finally {
      setReporting(false);
    }
  };

  const card = { backgroundColor: C.card, borderRadius: 16, padding: 16, marginTop: 12 } as const;
  const input = { backgroundColor: C.bg, borderRadius: 10, padding: 10, color: C.brown, marginTop: 4 } as const;
  const small = { fontSize: 13, color: C.grey, marginTop: 12 } as const;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 60 }}>
      <Text style={{ fontSize: 34, fontWeight: "700", color: C.brown, fontFamily: SERIF }}>Insights</Text>

      {/* ---- PCOS pattern check ---- */}
      <View style={{ ...card, borderLeftWidth: 5, borderLeftColor: pcos?.ready ? LEVEL_COLOR[pcos.level] : C.pink }}>
        <Text style={{ fontWeight: "600", color: C.brown }}>PCOS pattern check</Text>

        {pcos?.ready && (<>
          <Text style={{ marginTop: 6, fontSize: 18, fontWeight: "700", color: C.brown }}>{LEVEL_TEXT[pcos.level]}</Text>
          <Text style={{ color: C.brown, marginTop: 2 }}>to patterns seen in clinic patients who had PCOS</Text>

          {pcos.reasons_raising.length > 0 && (<>
            <Text style={small}>WHAT RAISED IT</Text>
            {pcos.reasons_raising.map((r: any, i: number) => (
              <Text key={i} style={{ color: C.brown, marginTop: 4 }}>•  {r.factor}</Text>
            ))}
          </>)}
          {pcos.reasons_lowering.length > 0 && (<>
            <Text style={small}>WHAT LOWERED IT</Text>
            {pcos.reasons_lowering.map((r: any, i: number) => (
              <Text key={i} style={{ color: C.brown, marginTop: 4 }}>•  {r.factor}</Text>
            ))}
          </>)}
          <Text style={{ ...small, marginTop: 14 }}>{pcos.data_note}</Text>
          <Text style={{ fontSize: 11, color: C.grey, marginTop: 6 }}>{pcos.note}</Text>
        </>)}

        {pcos && !pcos.ready && <Text style={{ color: C.brown, marginTop: 6 }}>{pcos.message}</Text>}
        {!pcos && <Text style={{ color: C.grey, marginTop: 6 }}>Checking...</Text>}

        <Pressable onPress={() => setShowForm(!showForm)} style={{ marginTop: 14 }}>
          <Text style={{ color: C.brown, fontWeight: "600", textDecorationLine: "underline" }}>
            {showForm ? "Hide health profile" : "Edit health profile"}
          </Text>
        </Pressable>
      </View>

      {/* ---- Health profile form ---- */}
      {showForm && (
        <View style={card}>
          <Text style={{ fontWeight: "600", color: C.brown }}>Your health profile</Text>
          <Text style={{ color: C.grey, marginTop: 4, fontSize: 12 }}>
            Stays on this device's backend. Used only for the pattern check above.
          </Text>

          <Text style={small}>AGE</Text>
          <TextInput style={input} keyboardType="numeric" value={form.age} onChangeText={(t) => setForm({ ...form, age: t })} placeholder="e.g. 24" />
          <Text style={small}>HEIGHT (CM)</Text>
          <TextInput style={input} keyboardType="numeric" value={form.height_cm} onChangeText={(t) => setForm({ ...form, height_cm: t })} placeholder="e.g. 165" />
          <Text style={small}>WEIGHT (KG)</Text>
          <TextInput style={input} keyboardType="numeric" value={form.weight_kg} onChangeText={(t) => setForm({ ...form, weight_kg: t })} placeholder="e.g. 60" />

          <Text style={{ ...small, marginBottom: 4 }}>TAP ANY THAT APPLY</Text>
          {YESNO.map(([key, label]) => (
            <Toggle key={key} label={label} on={!!form[key]} onPress={() => setForm({ ...form, [key]: !form[key] })} />
          ))}

          {error !== "" && <Text style={{ color: "#C76B7A", marginTop: 8 }}>{error}</Text>}
          <Pressable onPress={save} style={{ backgroundColor: C.yellow, borderRadius: 12, padding: 14, marginTop: 14, alignItems: "center" }}>
            <Text style={{ color: C.brown, fontWeight: "700" }}>Save profile</Text>
          </Pressable>
        </View>
      )}

      {/* ---- Endometriosis pattern check ---- */}
      <View style={{ ...card, borderLeftWidth: 5, borderLeftColor: endo?.ready ? LEVEL_COLOR[endo.level] : C.pink }}>
        <Text style={{ fontWeight: "600", color: C.brown }}>Endometriosis pattern check</Text>

        {endo?.ready && (<>
          <Text style={{ marginTop: 6, fontSize: 18, fontWeight: "700", color: C.brown }}>{LEVEL_TEXT[endo.level]}</Text>
          <Text style={{ color: C.brown, marginTop: 2 }}>to the symptom pattern reported in women diagnosed with endometriosis</Text>

          {endo.reasons_raising.length > 0 ? (<>
            <Text style={small}>WHAT RAISED IT</Text>
            {endo.reasons_raising.map((r: any, i: number) => (
              <View key={i} style={{ marginTop: 6 }}>
                <Text style={{ color: C.brown }}>•  {r.factor}</Text>
                <Text style={{ color: C.grey, fontSize: 13, marginLeft: 14 }}>{r.evidence}</Text>
              </View>
            ))}
          </>) : (
            <Text style={{ ...small, color: C.brown }}>None of the symptom patterns we look for showed up in your logs.</Text>
          )}

          {endo.not_seen.length > 0 && (<>
            <Text style={small}>NOT SEEN IN YOUR LOGS</Text>
            <Text style={{ color: C.brown, marginTop: 4 }}>{endo.not_seen.join(", ")}</Text>
          </>)}

          <Text style={{ ...small, marginTop: 14 }}>{endo.data_note}</Text>
          <Text style={{ fontSize: 11, color: C.grey, marginTop: 6 }}>{endo.note}</Text>
        </>)}

        {endo && !endo.ready && <Text style={{ color: C.brown, marginTop: 6 }}>{endo.message}</Text>}
        {!endo && <Text style={{ color: C.grey, marginTop: 6 }}>Checking...</Text>}
      </View>

      {/* ---- Stuff from before ---- */}
      {loading && !a && (
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <ActivityIndicator color={C.brown} />
          <Text style={{ color: C.grey, marginTop: 8 }}>Reading your logs...</Text>
        </View>
      )}

      {a && (<>
        <Text style={{ color: C.brown, marginTop: 20 }}>{a.summary}</Text>

        {a.ai_summary && (
          <View style={{ ...card, borderLeftWidth: 5, borderLeftColor: C.pink }}>
            <Text style={{ fontWeight: "600", color: C.brown }}>Your personal summary</Text>
            <Text style={{ marginTop: 6, lineHeight: 22, color: C.brown }}>{a.ai_summary}</Text>
            <Text style={{ marginTop: 8, fontSize: 11, color: C.grey }}>Written by AI from your logs</Text>
          </View>
        )}

        {a.findings.map((f: any, i: number) => (
          <View key={i} style={{ ...card, borderLeftWidth: 5, borderLeftColor: f.level === "watch" ? "#C76B7A" : C.yellow }}>
            <Text style={{ fontWeight: "600", color: C.brown }}>{f.title}</Text>
            <Text style={{ marginTop: 4 }}>{f.detail}</Text>
          </View>
        ))}
        <Text style={{ color: C.grey, marginTop: 20, fontSize: 12 }}>{a.disclaimer}</Text>
      </>)}

      {/* ---- Generate Report (same look as the Daily log's "Save check-in" button) ---- */}
      <Pressable style={{ backgroundColor: C.brown, padding: 16, borderRadius: 14, marginTop: 24, alignItems: "center", opacity: reporting ? 0.7 : 1 }}
        disabled={reporting} onPress={makeReport}>
        {reporting
          ? <ActivityIndicator color="white" />
          : <Text style={{ color: "white", fontWeight: "600" }}>Generate Report</Text>}
      </Pressable>
      <Text style={{ color: C.grey, fontSize: 12, textAlign: "center", marginTop: 16, lineHeight: 18 }}>
        A PDF of your raw logged data to save, print, or share with your clinician.
      </Text>
    </ScrollView>
  );
}
