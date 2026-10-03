import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  tone?: "dark" | "light";
  hideLabel?: boolean;
  placeholder?: string;
} & Pick<TextInputProps, "secureTextEntry" | "keyboardType" | "autoCapitalize" | "autoCorrect" | "onSubmitEditing">;

export function Field({
  label,
  value,
  onChangeText,
  tone = "dark",
  hideLabel = false,
  placeholder,
  autoCapitalize = "none",
  autoCorrect = false,
  secureTextEntry,
  keyboardType,
  onSubmitEditing,
}: FieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  return (
    <View style={styles.field}>
      {hideLabel ? null : <Text style={[typography.label, tone === "light" ? styles.lightLabel : null]}>{label}</Text>}
      <View>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, tone === "light" && styles.authInput, secureTextEntry && styles.passwordInput]}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        secureTextEntry={Boolean(secureTextEntry && !passwordVisible)}
        keyboardType={keyboardType}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.placeholder}
      />
      {secureTextEntry ? <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${passwordVisible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        onPress={() => setPasswordVisible(visible => !visible)}
        style={({ pressed }) => [styles.visibilityButton, pressed && { opacity: 0.6 }]}
      >
        <View accessible={false} pointerEvents="none" style={styles.eye}>
          <View style={styles.pupil} />
          {passwordVisible ? <View style={styles.slash} /> : null}
        </View>
      </Pressable> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
    alignSelf: "stretch",
  },
  lightLabel: {
    color: colors.white,
  },
  input: {
    ...typography.input,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.avatar,
    borderRadius: 7,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  authInput: { borderRadius: radius.pill, minHeight: 54, paddingHorizontal: 22 },
  passwordInput: { paddingRight: 58 },
  visibilityButton: { position: "absolute", right: 6, top: 0, bottom: 0, width: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  eye: { width: 24, height: 16, borderWidth: 2, borderColor: "#397E7B", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  pupil: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#397E7B" },
  slash: { position: "absolute", width: 28, height: 2, backgroundColor: "#397E7B", transform: [{ rotate: "-45deg" }] },
});
