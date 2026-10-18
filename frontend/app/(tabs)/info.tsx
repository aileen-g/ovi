import { View, Text, ScrollView, Platform, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../lib/api";

const MUTED = "#7B6F73";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, serif" });

// Placeholder cards. Swap these for real data later (title, value, unit, note).
const CONDITIONS = [
  {
    title: "Polycystic Ovary Syndrome (PCOS)",
    body: "PCOS is a common hormonal condition that can cause irregular or missed periods, acne, excess hair growth, and hair thinning. It’s also linked to insulin resistance and fertility challenges. Despite the name, not everyone has cysts.",
    image: require("../../assets/images/ovaries/uterus_endo.png"),
  },
  {
    title: "Menopause",
    body: "Menopause is when you’ve gone 12 months without a period. The years before it are called perimenopause, which bring irregular cycles, hot flashes, poor sleep, and mood changes.",
    image: require("../../assets/images/ovaries/uterus_meno.png"),
  },
  {
    title: "Endometriosis",
    body: "Endometriosis is a condition where tissue like the uterine lining grows outside the uterus. It can cause severe period pain, pain during sex, heavy bleeding, and fatigue. It’s often undiagnosed for years.",
    image: require("../../assets/images/ovaries/uterus_pcos.png"),
  },

];

export default function Info() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}>
      <Text style={{ fontSize: 30, fontWeight: "700", color: C.brown, fontFamily: SERIF, marginTop: 8, marginBottom: 16 }}>
        General Information
      </Text>

      {CONDITIONS.map((c, i) => (
        <View key={i} style={{ backgroundColor: C.card, borderRadius: 20, paddingVertical: 20, paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: MUTED }}>{c.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
            <Text style={{ flex: 1, fontSize: 13, lineHeight: 16, color: MUTED }}>{c.body}</Text>
            <Image
              source={c.image}
              resizeMode="contain"
              accessibilityLabel={`${c.title} illustration`}
              style={{ width: 120, height: 100, marginLeft: 12 }}
            />
          </View>
        </View>
      ))}

      <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 12 }}>
        <Ionicons name="information-circle-outline" size={18} color={MUTED} style={{ marginTop: 2 }} />
        <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, lineHeight: 21, color: MUTED }}>
          These are basic summaries of conditions. Do not use this to diagnose yourself. Seek a certified healthcare provider for major concerns.
        </Text>
      </View>
    </ScrollView>
  );
}
