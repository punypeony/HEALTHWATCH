import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback } from "react";
import { ScrollView, Text } from "react-native";

import { getDailyIntake } from "../api";
import { Card } from "../components/Card";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { colors } from "../theme/colors";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { DependentTabParamList, IntakeNutrient } from "../types";

type Props = BottomTabScreenProps<DependentTabParamList, "Intake">;

const NUTRIENTS: { key: string; label: string; unit: string; kind: "calorie" | "limit"; color: string }[] = [
  { key: "calories", label: "Calories", unit: "kcal", kind: "calorie", color: colors.calorie },
  { key: "sodium", label: "Sodium", unit: "mg", kind: "limit", color: colors.sodium },
  { key: "sugar", label: "Sugar", unit: "g", kind: "limit", color: colors.sugar },
  { key: "carbohydrates", label: "Carbohydrate", unit: "g", kind: "limit", color: colors.teal },
  { key: "saturated_fat", label: "Saturated fat", unit: "g", kind: "limit", color: colors.saturatedFat },
  { key: "protein", label: "Protein", unit: "g", kind: "limit", color: colors.forest },
];

function NutrientCard({
  label,
  unit,
  kind,
  color,
  nutrient,
}: {
  label: string;
  unit: string;
  kind: "calorie" | "limit";
  color: string;
  nutrient: IntakeNutrient;
}) {
  if (nutrient.incomplete) {
    return (
      <Card>
        <Text style={[typography.label, { color }]}>{label}</Text>
        <Text style={typography.body}>
          Some eaten meals are missing this value, so today's total is not shown.
        </Text>
      </Card>
    );
  }
  const goal = kind === "calorie" ? nutrient.target : nutrient.limit;
  return (
    <Card>
      <Text style={[typography.label, { color }]}>{label}</Text>
      <Text style={typography.body}>
        {nutrient.consumed} / {goal} {unit}
      </Text>
      <Text style={typography.body}>
        {kind === "calorie" ? `${nutrient.percentage}%` : `${nutrient.percentage}% of limit`}
      </Text>
      {kind === "limit" ? (
        <Text style={typography.body}>{nutrient.exceeded ? "Limit exceeded" : "Within limit"}</Text>
      ) : null}
      {kind === "calorie" && nutrient.exceeded ? <Text style={typography.body}>Target exceeded</Text> : null}
    </Card>
  );
}

export function IntakeScreen({ route }: Props) {
  const { dependentId } = route.params;
  const load = useCallback(() => getDailyIntake(dependentId), [dependentId]);
  const intake = useFocusedQuery(load);

  if (intake.status === "loading") {
    return <ScreenStatus title="Daily intake" message="Loading daily intake..." loading />;
  }
  if (intake.status === "error") {
    return (
      <ScreenStatus
        title="Daily intake"
        message={intake.message}
        actionLabel="Retry"
        onAction={intake.retry}
      />
    );
  }

  const data = intake.data;
  return (
    <ScrollView contentContainerStyle={screen.tabScroll}>
      <Text style={typography.body}>{data.date}</Text>
      {NUTRIENTS.map((item) => {
        const nutrient = data.nutrients[item.key];
        if (!nutrient) {
          return null;
        }
        return (
          <NutrientCard
            key={item.key}
            label={item.label}
            unit={item.unit}
            kind={item.kind}
            color={item.color}
            nutrient={nutrient}
          />
        );
      })}
    </ScrollView>
  );
}
