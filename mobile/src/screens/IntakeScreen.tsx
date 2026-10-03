import { Screen } from "../components/Screen";
import { QueryRefreshNotice } from "../components/QueryRefreshNotice";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback } from "react";
import { Text } from "react-native";

import { getDailyIntake } from "../api";
import { Card } from "../components/Card";
import { IntakeCard } from "../components/IntakeCard";
import { Button } from "../components/Button";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { colors } from "../theme/colors";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { DependentTabParamList } from "../types";

type Props = BottomTabScreenProps<DependentTabParamList, "Intake">;

const NUTRIENTS: { key: string; label: string; unit: string; kind: "calorie" | "limit"; color: string }[] = [
  { key: "calories", label: "Calories", unit: "kcal", kind: "calorie", color: colors.calorie },
  { key: "sodium", label: "Sodium", unit: "mg", kind: "limit", color: colors.sodium },
  { key: "sugar", label: "Sugar", unit: "g", kind: "limit", color: colors.sugar },
  { key: "carbohydrates", label: "Carbohydrate", unit: "g", kind: "limit", color: colors.teal },
  { key: "saturated_fat", label: "Saturated fat", unit: "g", kind: "limit", color: colors.saturatedFat },
  { key: "protein", label: "Protein", unit: "g", kind: "limit", color: colors.forest },
];

export function IntakeScreen({ route }: Props) {
  const { dependentId } = route.params;
  const load = useCallback(() => getDailyIntake(dependentId), [dependentId]);
  const intake = useFocusedQuery(`dependent:${dependentId}:intake`, load);

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
    <Screen title="Daily intake" contentContainerStyle={screen.tabScroll}>
      <QueryRefreshNotice query={intake} />
      <Text style={typography.body}>{data.date}</Text>
      <Card>
      {NUTRIENTS.map((item) => {
        const nutrient = data.nutrients[item.key];
        if (!nutrient) {
          return null;
        }
        return (
          <IntakeCard
            key={item.key}
            label={item.label}
            unit={item.unit}
            kind={item.kind}
            nutrient={nutrient}
          />
        );
      })}
      </Card>
      <Button label="Refresh" variant="secondary" onPress={intake.retry} />
    </Screen>
  );
}
