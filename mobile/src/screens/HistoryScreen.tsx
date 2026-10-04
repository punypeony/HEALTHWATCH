import { Screen } from "../components/Screen";
import { QueryRefreshNotice } from "../components/QueryRefreshNotice";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { deleteMeal, deleteMeals, listMeals } from "../api";
import { Button } from "../components/Button";
import { HistoryCard } from "../components/HistoryCard";
import { Card } from "../components/Card";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { DependentTabParamList, MealLog } from "../types";
import { errorMessage } from "../utils/errors";

type HistoryFilter = "all" | "eaten" | "uneaten";
const FILTERS: { id: HistoryFilter; label: string }[] = [
  { id: "all", label: "All scans" },
  { id: "eaten", label: "Eaten" },
  { id: "uneaten", label: "Not eaten" },
];

function mealWasEaten(meal: MealLog): boolean {
  return meal.grams_eaten != null && meal.grams_eaten > 0;
}

type Props = BottomTabScreenProps<DependentTabParamList, "History">;

export function HistoryScreen({ route }: Props) {
  const { dependentId } = route.params;
  const load = useCallback(() => listMeals(dependentId), [dependentId]);
  const meals = useFocusedQuery(`dependent:${dependentId}:meals`, load);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>("all");

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
        message={meals.refreshError ? `Showing previously loaded history. Refresh failed: ${meals.refreshError}` : meals.refreshing ? "Updating history…" : "No meals logged for this dependent yet."}
        actionLabel="Refresh"
        onAction={meals.retry}
      />
    );
  }

  const visible = meals.data.filter(meal =>
    filter === "all" || (filter === "eaten" ? mealWasEaten(meal) : !mealWasEaten(meal)));
  const emptyFilter = filter === "eaten" ? "No eaten scans." : "No uneaten scans.";

  return (
    <Screen title="Scan history" contentContainerStyle={screen.tabScroll}>
      <QueryRefreshNotice query={meals} />
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
      <View style={styles.filters}>
        {FILTERS.map(option => {
          const selected = filter === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setFilter(option.id)}
              style={[styles.filter, selected && styles.filterSelected]}
            >
              <Text style={[typography.buttonDark, selected && styles.filterSelectedText]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {visible.length === 0 ? <Text style={typography.body}>{emptyFilter}</Text> : (
        <Card>
          {visible.map(meal => <HistoryCard key={meal.id} meal={meal} onDelete={() =>
            Alert.alert("Delete scan", meal.product_name, [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => void removeOne(meal.id) },
            ])
          } />)}
        </Card>
      )}
      <Button label="Refresh" variant="secondary" onPress={meals.retry} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  filter: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.teal,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  filterSelected: { backgroundColor: colors.tealSoft },
  filterSelectedText: { color: colors.forest, fontWeight: "700" },
});
