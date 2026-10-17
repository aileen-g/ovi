import { Tabs } from "expo-router";
import { C } from "../../lib/api";
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: C.brown }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="log" options={{ title: "Daily log" }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
      <Tabs.Screen name="analysis" options={{ title: "Analysis" }} />
    </Tabs>
  );
}
