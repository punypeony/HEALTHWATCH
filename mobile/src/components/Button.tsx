import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  pending?: boolean;
  variant?: "primary" | "secondary" | "save" | "danger";
};

export function Button({
  label,
  onPress,
  disabled = false,
  pending = false,
  variant = "primary",
}: ButtonProps) {
  const textStyle =
    variant === "secondary"
      ? typography.buttonDark
      : variant === "save"
        ? styles.saveText
        : variant === "danger"
          ? styles.dangerText
          : typography.button;
  const spinner =
    variant === "primary" ? colors.white : variant === "danger" ? colors.deleteText : colors.forest;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || pending}
      style={[styles.base, styles[variant], disabled ? styles.disabled : null]}
    >
      {pending ? <ActivityIndicator color={spinner} /> : <Text style={textStyle}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  primary: {
    backgroundColor: colors.ink,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.avatar,
  },
  save: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.avatar,
  },
  danger: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.deleteText,
  },
  saveText: {
    ...typography.button,
    color: colors.ink,
  },
  dangerText: {
    ...typography.button,
    color: colors.deleteText,
  },
  disabled: {
    opacity: 0.6,
  },
});
