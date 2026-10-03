import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export type NutrientTone = "sodium" | "calorie" | "sugar" | "saturatedFat" | "carbohydrate" | "protein" | "other";
const tones = {
  sodium: { backgroundColor: "#FFE8A3", borderColor: "#BF6A02", color: colors.sodium },
  calorie: { backgroundColor: "#EADDFF", borderColor: "#6750A4", color: colors.calorie },
  sugar: { backgroundColor: "#FCB3AD", borderColor: "#EC221F", color: colors.sugar },
  saturatedFat: { backgroundColor: "#FFD8B5", borderColor: "#C77D35", color: "#8B4C26" },
  carbohydrate: { backgroundColor: "#CDE8FF", borderColor: "#4B8FC4", color: "#245B85" },
  protein: { backgroundColor: "#D5EDBE", borderColor: "#78A34C", color: "#42652A" },
  other: { backgroundColor: "#E3F2F1", borderColor: "#4EAAA5", color: colors.forest },
};

/** Dependent and IntakeLoader share the exported bordered nutrient tiles. */
export function NutritionTile({ label, value, tone, compact = false, children }: PropsWithChildren<{
  label: string; value: string; tone: NutrientTone; compact?: boolean;
}>) {
  const palette = tones[tone];
  return (
    <View style={[styles.tile, palette, compact && styles.compact]}>
      <Text style={[typography.label, { color: palette.color }, compact && styles.small]}>{label}</Text>
      <Text style={[typography.body, compact && styles.small]}>{value}</Text>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  tile: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 12, paddingVertical: 16, gap: 6 },
  compact: { flex: 1, minWidth: 0, paddingHorizontal: 5, paddingVertical: 11, gap: 3 },
  small: { fontSize: 12, lineHeight: 16 },
});
