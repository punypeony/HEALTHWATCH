import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  pending?: boolean;
  variant?: "primary" | "secondary";
};

export function Button({
  label,
  onPress,
  disabled = false,
  pending = false,
  variant = "primary",
}: ButtonProps) {
  const secondary = variant === "secondary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || pending}
      style={[styles.base, secondary ? styles.secondary : styles.primary, disabled ? styles.disabled : null]}
    >
      {pending ? (
        <ActivityIndicator color={secondary ? colors.forest : colors.white} />
      ) : (
        <Text style={secondary ? typography.buttonDark : typography.button}>{label}</Text>
      )}
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
    backgroundColor: colors.teal,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.teal,
  },
  disabled: {
    opacity: 0.6,
  },
});
