import { Text } from "react-native";
import type { IntakeNutrient } from "../types";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { NutritionTile, type NutrientTone } from "./NutritionTile";

export function IntakeCard({ label, unit, kind, nutrient }: {
  label: string; unit: string; kind: "calorie" | "limit"; nutrient: IntakeNutrient;
}) {
  const tone: NutrientTone = label === "Calories" ? "calorie" : label === "Sodium" ? "sodium" : label === "Sugar" ? "sugar" : label === "Saturated fat" ? "saturatedFat" : label === "Carbohydrate" ? "carbohydrate" : label === "Protein" ? "protein" : "other";
  if (nutrient.incomplete) {
    return <NutritionTile label={label} value="Total unavailable" tone={tone} colorValue>
      <Text style={typography.body}>Some eaten meals are missing this value, so today's total is not shown.</Text>
    </NutritionTile>;
  }
  const goal = kind === "calorie" ? nutrient.target : nutrient.limit;
  return (
    <NutritionTile label={label === "Calories" ? "Calorie" : label} value={`${nutrient.consumed ?? "—"} / ${goal ?? "—"} ${unit}`} tone={tone} colorValue>
      <Text style={typography.body}>{nutrient.percentage == null ? "Percentage unavailable" : `${nutrient.percentage}%${kind === "limit" ? " of limit" : ""}`}</Text>
      {kind === "limit" && nutrient.exceeded != null ? <Text style={[typography.body, nutrient.exceeded && { color: colors.error }]}>{nutrient.exceeded ? "Limit exceeded" : "Within limit"}</Text> : null}
      {kind === "calorie" && nutrient.exceeded ? <Text style={typography.body}>Target exceeded</Text> : null}
    </NutritionTile>
  );
}
