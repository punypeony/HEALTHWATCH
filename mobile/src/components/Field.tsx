import { Text, TextInput, View, type TextInputProps } from "react-native";

import { placeholder } from "../theme/placeholder";

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
} & Pick<TextInputProps, "secureTextEntry" | "keyboardType" | "autoCapitalize" | "autoCorrect" | "onSubmitEditing">;

export function Field({
  label,
  value,
  onChangeText,
  autoCapitalize = "none",
  autoCorrect = false,
  secureTextEntry,
  keyboardType,
  onSubmitEditing,
}: FieldProps) {
  return (
    <View style={placeholder.field}>
      <Text>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={placeholder.input}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onSubmitEditing={onSubmitEditing}
      />
    </View>
  );
}
