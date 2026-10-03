import { useEffect, useState, type PropsWithChildren, type ReactNode } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions, type KeyboardEvent } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export function AuthLayout({ children, title, compact = false, footer }: PropsWithChildren<{ title: string; compact?: boolean; footer?: ReactNode }>) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [keyboardTop, setKeyboardTop] = useState<number | null>(() => Keyboard.metrics()?.screenY ?? null);
  useEffect(() => {
    const show = (event: KeyboardEvent) => {
      if (Platform.OS === "ios") Keyboard.scheduleLayoutAnimation(event);
      setKeyboardTop(event.endCoordinates.height > 0 ? event.endCoordinates.screenY : null);
    };
    const hide = (event: KeyboardEvent) => {
      if (Platform.OS === "ios") Keyboard.scheduleLayoutAnimation(event);
      setKeyboardTop(null);
    };
    const shown = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow", show);
    const hidden = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", hide);
    return () => { shown.remove(); hidden.remove(); };
  }, []);
  // Android already resizes the window: min prevents subtracting the keyboard twice.
  const availableHeight = Math.max(0, Math.min(height, keyboardTop ?? height) - insets.top - insets.bottom);
  const logoHeight = keyboardTop !== null
    ? Math.max(64, Math.min(compact ? 100 : 130, availableHeight * 0.22))
    : Math.min(compact ? 260 : 430, height * (compact ? 0.29 : 0.47));
  return (
    <View style={styles.background}>
      <Image accessible={false} source={require("../../assets/design/background.png")}
        style={StyleSheet.absoluteFill} resizeMode="stretch" />
      <SafeAreaView style={styles.fill}>
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets={false}>
            <View style={[styles.brand, { height: logoHeight }, keyboardTop !== null && styles.compactBrand]}>
              <Image source={require("../../assets/design/brand.png")} accessibilityLabel="HealthWatch" resizeMode="contain" style={styles.logo} />
            </View>
            <View style={[styles.sheet, keyboardTop !== null && styles.compactSheet]}>
              <Text accessibilityRole="header" style={[typography.welcome, { color: colors.forest }]}>{title}</Text>
              {children}
              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export const authText = StyleSheet.create({
  note: { ...typography.body, color: colors.body },
  error: { ...typography.body, color: colors.error },
});
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#79BDA5" },
  footer: { marginTop: "auto", paddingTop: 16 },
  fill: { flex: 1 },
  scroll: { flexGrow: 1 },
  brand: { alignItems: "center", justifyContent: "center", padding: 20 },
  compactBrand: { padding: 8 },
  compactSheet: { paddingVertical: 16 },
  logo: { width: "100%", height: "100%", maxWidth: 360 },
  sheet: { flexGrow: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: "#DCE8E2", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 12 },
});
