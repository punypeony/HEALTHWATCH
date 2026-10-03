import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** UI/Header with native safe-area spacing and working navigation actions. */
export function AppHeader({ subtitle, onLogout }: { subtitle?: string; onLogout: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Image accessible={false} source={require("../../assets/design/header-background.png")} style={StyleSheet.absoluteFill} resizeMode="stretch" />
      <View style={styles.row}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.brand}>HealthWatch</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Pressable accessibilityRole="button" onPress={onLogout} style={styles.control}><Text style={styles.logout}>Log out</Text></Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { backgroundColor: "transparent", paddingHorizontal: 16, paddingBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  heading: { flex: 1, gap: 3 },
  brand: { fontSize: 24, lineHeight: 31, fontWeight: "700", letterSpacing: 0.7, color: "#000000" },
  subtitle: { fontSize: 13, color: "#1E1E1E" },
  control: { minHeight: 44, minWidth: 44, justifyContent: "center", alignItems: "center" },
  logout: { color: "#135246", fontSize: 12, fontWeight: "600" },
});
