import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { DesignIcon, type DesignIconName } from "./DesignIcon";
import { BottomFade } from "./BottomFade";

export type NavigationItem = "Home" | "Summary" | "Scan" | "Intake" | "Alerts";
const items: { name: NavigationItem; label: string; icon: DesignIconName }[] = [
  { name: "Home", label: "Home", icon: "home" },
  { name: "Summary", label: "Overview", icon: "overview" },
  { name: "Scan", label: "Scan", icon: "scan" },
  { name: "Intake", label: "Intake", icon: "intake" },
  { name: "Alerts", label: "Alerts", icon: "alerts" },
];
export function NavigationBar({ current, bottomInset, onSelect, onLongPress, onLayout, floating = true }: {
  current: string; bottomInset: number; onSelect: (name: NavigationItem) => void; onLongPress?: (name: NavigationItem) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  floating?: boolean;
}) {
  return (
    <View pointerEvents="box-none" onLayout={onLayout} style={[styles.container, !floating && { position: "relative" }, { paddingBottom: Math.max(bottomInset, 16) + 8 }]}>
      <BottomFade />
      <View style={styles.bar}>
        {items.map(({ name, label, icon }) => {
          const selected = current === name || (name === "Summary" && current === "History");
          const scan = name === "Scan";
          return (
            <Pressable key={name} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }}
              onPress={() => onSelect(name)} onLongPress={() => onLongPress?.(name)}
              style={({ pressed }) => [styles.tab, scan && styles.scan, pressed && styles.pressed]}>
              <DesignIcon name={icon} size={scan ? 34 : 22} color={selected ? "#135246" : "#1E1E1E"} />
              {scan ? null : <Text style={[styles.label, selected && styles.active]}>{label}</Text>}
              {selected && !scan ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "transparent", paddingTop: 40, paddingHorizontal: 28 },
  bar: { flexDirection: "row", alignItems: "center", borderRadius: 60, backgroundColor: "rgba(255,255,255,0.96)", borderWidth: 1, borderColor: "#DCE8E2", paddingHorizontal: 8, minHeight: 62 },
  tab: { flex: 1, minHeight: 54, alignItems: "center", justifyContent: "center", gap: 3 },
  scan: { flex: 0, width: 68, height: 68, marginTop: -30, marginHorizontal: 2, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#14AE5C", borderRadius: 34 },
  label: { fontSize: 11, lineHeight: 14, fontWeight: "600", color: "#1E1E1E" },
  active: { color: "#135246", fontWeight: "800" },
  dot: { position: "absolute", bottom: 0, width: 4, height: 4, borderRadius: 2, backgroundColor: "#135246" },
  pressed: { opacity: 0.6 },
});
