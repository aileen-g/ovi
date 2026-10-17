import { Tabs } from "expo-router";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../../lib/api";

// Tab names (the `name`) match the file names in this folder. Only the labels (`title`) changed:
//   index.tsx -> Home,  log.tsx -> Daily log,  insights.tsx -> History,
//   analysis.tsx -> Insights,  info.tsx -> Info (new)
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.brown,
        tabBarInactiveTintColor: "#9A8683",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#EEEEEE" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home",
        tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="log" options={{ title: "Daily log",
        tabBarIcon: ({ color, size }) => <Ionicons name="create-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="insights" options={{ title: "History",
        tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="analysis" options={{ title: "Insights",
        tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="info" options={{ title: "Info",
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20, fontWeight: "700" }}>?</Text> }} />
    </Tabs>
  );
}