import { Pressable, StyleSheet, Text, View } from "react-native";

export function AuthSwitch({ register = false, onPress }: { register?: boolean; onPress: () => void }) {
  return (
    <View collapsable={false} style={styles.surface}>
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.text}>{register ? "Already have an account? " : "Don’t have an account yet? "}
        <Text style={styles.link}>{register ? "Log in." : "Sign up."}</Text>
      </Text>
    </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  surface: { backgroundColor: "#FFFFFF", borderColor: "#4EAAA5", borderWidth: 1, borderRadius: 999, overflow: "hidden", marginTop: 16, flexShrink: 0 },
  button: { borderRadius: 999, minHeight: 54, padding: 15, backgroundColor: "#FFFFFF", opacity: 1, justifyContent: "center" },
  text: { textAlign: "center", fontSize: 14, lineHeight: 20, color: "#2C2C2C" },
  link: { color: "#397E7B", fontWeight: "700", textDecorationLine: "underline" },
});
