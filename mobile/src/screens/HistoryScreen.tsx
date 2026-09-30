import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

import { listMeals } from "../api";
import { Button } from "../components/Button";
import { RiskBadge } from "../components/RiskBadge";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { DependentTabParamList } from "../types";
import { formatWhen, nutritionBasis } from "../utils/format";

type Props = BottomTabScreenProps<DependentTabParamList, "History">;

function ProductPhoto({ uri }: { uri?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.avatar,
        }}
      />
    );
  }
  return (
    <Image
      accessibilityLabel="Product photo"
      source={{ uri }}
      onError={() => setFailed(true)}
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.avatar,
      }}
    />
  );
}

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
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.avatar,
            borderRadius: radius.card,
            padding: spacing.sm,
            gap: spacing.sm,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <ProductPhoto uri={meal.image_url} />
          <View style={{ flex: 1, gap: spacing.xs }}>
            <RiskBadge label={meal.risk_label} />
            <Text style={typography.label}>{meal.product_name}</Text>
            <Text style={typography.body}>{nutritionBasis(meal.barcode)}</Text>
            <Text style={[typography.body, { color: colors.sodium }]}>
              Sodium {meal.sodium_mg} mg
            </Text>
            <Text style={[typography.body, { color: colors.calorie }]}>
              Calories {meal.calories} kcal
            </Text>
            <Text style={[typography.body, { color: colors.sugar }]}>Sugar {meal.sugar_g} g</Text>
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
