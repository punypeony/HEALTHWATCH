import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { DesignIcon, type DesignIconName } from "./DesignIcon";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  pending?: boolean;
  variant?: "primary" | "secondary" | "save" | "muted" | "danger" | "outline" | "glass" | "dark" | "auth";
  icon?: DesignIconName;
};

export function Button({
  label,
  onPress,
  disabled = false,
  pending = false,
  variant = "primary",
  icon,
}: ButtonProps) {
  const textStyle =
    variant === "outline" || variant === "glass"
      ? styles.outlineText
      : variant === "secondary"
      ? typography.buttonDark
      : variant === "save"
        ? styles.saveText
        : variant === "danger"
          ? styles.dangerText
          : typography.button;
  const spinner =
    ["primary", "save", "muted", "dark", "auth"].includes(variant) ? colors.white : variant === "danger" ? colors.deleteText : colors.forest;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || pending, busy: pending }}
      onPress={onPress}
      disabled={disabled || pending}
      style={({ pressed }) => [styles.base, styles[variant], disabled || pending || pressed ? styles.disabled : null]}
    >
      {pending ? <ActivityIndicator color={spinner} /> : <>
        {icon ? <DesignIcon name={icon} color={spinner} size={22} /> : null}
        <Text style={[textStyle, styles.text]}>{label}</Text>
      </>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primary: {
    backgroundColor: "#4EAAA5",
  },
  auth: { backgroundColor: "#4EAAA5" },
  muted: { backgroundColor: "#397E7B", borderWidth: 1, borderColor: "#326D6A" },
  dark: { backgroundColor: colors.ink },
  outline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#4EAAA5" },
  glass: { backgroundColor: "rgba(255,255,255,0.75)", borderWidth: 1, borderColor: "#4EAAA5" },
  outlineText: { ...typography.button, color: "#397E7B" },
  text: { flexShrink: 1 },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.teal,
  },
  save: {
    backgroundColor: colors.saveBorder,
    borderWidth: 1,
    borderColor: colors.teal,
  },
  danger: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.deleteText,
  },
  saveText: {
    ...typography.button,
    color: colors.white,
  },
  dangerText: {
    ...typography.button,
    color: colors.deleteText,
  },
  disabled: {
    opacity: 0.6,
  },
});
