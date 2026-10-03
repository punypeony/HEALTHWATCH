import { Screen } from "../components/Screen";
import { QueryRefreshNotice } from "../components/QueryRefreshNotice";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { deleteMeal, deleteMeals, listMeals } from "../api";
import { Button } from "../components/Button";
import { HistoryCard } from "../components/HistoryCard";
import { Card } from "../components/Card";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { screen } from "../theme/screen";
import type { DependentTabParamList } from "../types";
import { errorMessage } from "../utils/errors";

type Props = BottomTabScreenProps<DependentTabParamList, "History">;

export function HistoryScreen({ route }: Props) {
  const { dependentId } = route.params;
  const load = useCallback(() => listMeals(dependentId), [dependentId]);
  const meals = useFocusedQuery(`dependent:${dependentId}:meals`, load);
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
        message={meals.refreshError ? `Showing previously loaded history. Refresh failed: ${meals.refreshError}` : meals.refreshing ? "Updating history…" : "No meals logged for this dependent yet."}
        actionLabel="Refresh"
        onAction={meals.retry}
      />
    );
  }

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
      <Card>
        {meals.data.map(meal => <HistoryCard key={meal.id} meal={meal} onDelete={() =>
          Alert.alert("Delete scan", meal.product_name, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => void removeOne(meal.id) },
          ])
        } />)}
      </Card>
      <Button label="Refresh" variant="secondary" onPress={meals.retry} />
    </Screen>
  );
}
