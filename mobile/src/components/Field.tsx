import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  tone?: "dark" | "light";
} & Pick<TextInputProps, "secureTextEntry" | "keyboardType" | "autoCapitalize" | "autoCorrect" | "onSubmitEditing">;

export function Field({
  label,
  value,
  onChangeText,
  tone = "dark",
  autoCapitalize = "none",
  autoCorrect = false,
  secureTextEntry,
  keyboardType,
  onSubmitEditing,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={[typography.label, tone === "light" ? styles.lightLabel : null]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onSubmitEditing={onSubmitEditing}
        placeholder={label}
        placeholderTextColor={colors.placeholder}
      />
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
    borderRadius: radius.card,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
