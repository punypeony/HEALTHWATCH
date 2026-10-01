import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";

import { deleteMeal, deleteMeals, listMeals } from "../api";
import { Button } from "../components/Button";
import { RiskBadge } from "../components/RiskBadge";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { DependentTabParamList } from "../types";
import { errorMessage } from "../utils/errors";
import { formatWhen, nutritionBasis, twoDecimals } from "../utils/format";

type Props = BottomTabScreenProps<DependentTabParamList, "History">;

function historyNutrient(
  per100g: number,
  gramsEaten: number | null | undefined,
  unit: string,
  name: string,
): string {
  if (gramsEaten != null && gramsEaten > 0) {
    const scaled = Math.round((per100g * gramsEaten) / 100 * 100) / 100;
    return `${name} ${twoDecimals(scaled)} ${unit} eaten`;
  }
  return `${name} ${per100g} ${unit}`;
}

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
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function removeOne(mealId: number) {
    try {
      await deleteMeal(mealId);
      setDeleteError(null);
      meals.retry();
    } catch (error) {
      setDeleteError(errorMessage(error));
    }
  }

  async function removeAll() {
    try {
      await deleteMeals(dependentId);
      setDeleteError(null);
      meals.retry();
    } catch (error) {
      setDeleteError(errorMessage(error));
    }
  }

  if (meals.status === "loading") {
    return <ScreenStatus title="Scan History" message="Loading meal history..." loading />;
  }

  if (deleteError || meals.status === "error") {
    return (
      <ScreenStatus
        title="Scan History"
        message={deleteError ?? (meals.status === "error" ? meals.message : "")}
        actionLabel="Retry"
        onAction={() => {
          setDeleteError(null);
          meals.retry();
        }}
      />
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
      <Button
        label="Clear history"
        variant="danger"
        onPress={() =>
          Alert.alert("Clear history", "This removes every scan for this dependent.", [
            { text: "Cancel", style: "cancel" },
            { text: "Clear history", onPress: () => void removeAll() },
          ])
        }
      />
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
              {historyNutrient(meal.sodium_mg, meal.grams_eaten, "mg", "Sodium")}
            </Text>
            <Text style={[typography.body, { color: colors.calorie }]}>
              {historyNutrient(meal.calories, meal.grams_eaten, "kcal", "Calories")}
            </Text>
            <Text style={[typography.body, { color: colors.sugar }]}>
              {historyNutrient(meal.sugar_g, meal.grams_eaten, "g", "Sugar")}
            </Text>
            <Text style={typography.body}>{formatWhen(meal.created_at)}</Text>
            {meal.risk_reasons.map((reason, index) => (
              <Text key={`${meal.id}-${index}`} style={typography.body}>
                {reason}
              </Text>
            ))}
            <Button
              label="Delete"
              variant="danger"
              onPress={() =>
                Alert.alert("Delete scan", meal.product_name, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", onPress: () => void removeOne(meal.id) },
                ])
              }
            />
          </View>
        </View>
      ))}
      <Button label="Refresh" variant="secondary" onPress={meals.retry} />
    </ScrollView>
  );
}
