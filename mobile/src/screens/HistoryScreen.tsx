import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";

import { listMeals } from "../api";
import { Button } from "../components/Button";
import { RiskBadge, riskFill } from "../components/RiskBadge";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { DependentTabParamList } from "../types";
import { formatWhen } from "../utils/format";

type Props = BottomTabScreenProps<DependentTabParamList, "History">;

export function HistoryScreen({ route }: Props) {
  const { dependentId } = route.params;
  const load = useCallback(() => listMeals(dependentId), [dependentId]);
  const meals = useFocusedQuery(load);

  if (meals.status === "loading") {
    return <ScreenStatus title="Scan History" message="Loading meal history..." loading />;
  }

  if (meals.status === "error") {
    return (
      <ScreenStatus title="Scan History" message={meals.message} actionLabel="Retry" onAction={meals.retry} />
    );
  }

  if (meals.data.length === 0) {
    return (
      <ScreenStatus
        title="Scan History"
        message="No meals logged for this dependent yet."
        actionLabel="Refresh"
        onAction={meals.retry}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={screen.tabScroll}>
      {meals.data.map((meal) => (
        <View
          key={meal.id}
          style={{
            backgroundColor: riskFill(meal.risk_label),
            borderRadius: radius.card,
            padding: spacing.sm,
            gap: spacing.sm,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.avatar,
            }}
          />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <RiskBadge label={meal.risk_label} />
            <Text style={typography.body}>{formatWhen(meal.created_at)}</Text>
            {meal.risk_reasons.map((reason, index) => (
              <Text key={`${meal.id}-${index}`} style={typography.body}>
                {reason}
              </Text>
            ))}
          </View>
        </View>
      ))}
      <Button label="Refresh" variant="secondary" onPress={meals.retry} />
    </ScrollView>
  );
}
