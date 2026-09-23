import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { listMeals } from "../api";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { placeholder } from "../theme/placeholder";
import type { DependentTabParamList } from "../types";
import { formatWhen } from "../utils/format";

type Props = BottomTabScreenProps<DependentTabParamList, "History">;

export function HistoryScreen({ route }: Props) {
  const { dependentId } = route.params;
  const load = useCallback(() => listMeals(dependentId), [dependentId]);
  const meals = useFocusedQuery(load);

  if (meals.status === "loading") {
    return <ScreenStatus title="History" message="Loading meal history..." loading />;
  }

  if (meals.status === "error") {
    return (
      <ScreenStatus title="History" message={meals.message} actionLabel="Retry" onAction={meals.retry} />
    );
  }

  if (meals.data.length === 0) {
    return (
      <ScreenStatus
        title="History"
        message="No meals logged for this dependent yet."
        actionLabel="Refresh"
        onAction={meals.retry}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={placeholder.screen}>
      <Text style={placeholder.title}>History</Text>
      {meals.data.map((meal) => (
        <View key={meal.id} style={placeholder.card}>
          <Text>{meal.risk_label}</Text>
          <Text>{formatWhen(meal.created_at)}</Text>
          {meal.risk_reasons.map((reason, index) => (
            <Text key={`${meal.id}-${index}`}>{reason}</Text>
          ))}
        </View>
      ))}
      <Pressable onPress={meals.retry} style={placeholder.button}>
        <Text>Refresh</Text>
      </Pressable>
    </ScrollView>
  );
}
