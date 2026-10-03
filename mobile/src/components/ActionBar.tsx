import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "./Button";
import { BottomFade } from "./BottomFade";

/** Bottom actions from the Navigation component's Buttons variant. */
export function ActionBar({ onAdd, onRefresh }: { onAdd: () => void; onRefresh: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
      <BottomFade />
      <View style={styles.button}><Button label="Add" onPress={onAdd} /></View>
      <View style={styles.button}><Button label="Refresh" variant="glass" onPress={onRefresh} /></View>
    </View>
  );
}
const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 32, paddingTop: 28 },
  button: { flex: 1 },
});
