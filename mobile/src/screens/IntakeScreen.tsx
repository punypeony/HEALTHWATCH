import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";

import { getDailyIntake } from "../api";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { placeholder } from "../theme/placeholder";
import type { DependentTabParamList, IntakeNutrient } from "../types";

type Props = BottomTabScreenProps<DependentTabParamList, "Intake">;

const NUTRIENTS: { key: string; label: string; unit: string; kind: "calorie" | "limit" }[] = [
  { key: "calories", label: "Calories", unit: "kcal", kind: "calorie" },
  { key: "sodium", label: "Sodium", unit: "mg", kind: "limit" },
  { key: "sugar", label: "Sugar", unit: "g", kind: "limit" },
  { key: "carbohydrates", label: "Carbohydrate", unit: "g", kind: "limit" },
  { key: "saturated_fat", label: "Saturated fat", unit: "g", kind: "limit" },
  { key: "protein", label: "Protein", unit: "g", kind: "limit" },
];

function NutrientCard({ label, unit, kind, nutrient }: {
  label: string;
  unit: string;
  kind: "calorie" | "limit";
  nutrient: IntakeNutrient;
}) {
  if (nutrient.incomplete) {
    return (
      <View style={placeholder.card}>
        <Text>{label}</Text>
        <Text>Some eaten meals are missing this value, so today's total is not shown.</Text>
      </View>
    );
  }
  const goal = kind === "calorie" ? nutrient.target : nutrient.limit;
  return (
    <View style={placeholder.card}>
      <Text>{label}</Text>
      <Text>
        {nutrient.consumed} / {goal} {unit}
      </Text>
      <Text>{kind === "calorie" ? `${nutrient.percentage}%` : `${nutrient.percentage}% of limit`}</Text>
      {kind === "limit" ? <Text>{nutrient.exceeded ? "Limit exceeded" : "Within limit"}</Text> : null}
      {kind === "calorie" && nutrient.exceeded ? <Text>Target exceeded</Text> : null}
    </View>
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
    <ScrollView contentContainerStyle={placeholder.screen}>
      <Text style={placeholder.title}>Daily intake</Text>
      <Text>{data.date}</Text>
      {NUTRIENTS.map((item) => {
        const nutrient = data.nutrients[item.key];
        if (!nutrient) {
          return null;
        }
        return <NutrientCard key={item.key} label={item.label} unit={item.unit} kind={item.kind} nutrient={nutrient} />;
      })}
    </ScrollView>
  );
}
