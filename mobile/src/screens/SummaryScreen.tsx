import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";

import { getWeeklySummary } from "../api";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { placeholder } from "../theme/placeholder";
import type { DependentTabParamList } from "../types";

type Props = BottomTabScreenProps<DependentTabParamList, "Summary">;

export function SummaryScreen({ route }: Props) {
  const { dependentId } = route.params;
  const load = useCallback(() => getWeeklySummary(dependentId), [dependentId]);
  const summary = useFocusedQuery(load);

  if (summary.status === "loading") {
    return <ScreenStatus title="Weekly summary" message="Loading weekly summary..." loading />;
  }

  if (summary.status === "error") {
    return (
      <ScreenStatus
        title="Weekly summary"
        message={summary.message}
        actionLabel="Retry"
        onAction={summary.retry}
      />
    );
  }

  const data = summary.data;
  return (
    <ScrollView contentContainerStyle={placeholder.screen}>
      <Text style={placeholder.title}>Weekly summary</Text>
      <View style={placeholder.card}>
        <Text>Total scans: {data.total_scans}</Text>
        <Text>Safe: {data.safe_count}</Text>
        <Text>Warning: {data.warning_count}</Text>
        <Text>Danger: {data.danger_count}</Text>
        <Text>Common reason: {data.common_reason ?? "None"}</Text>
      </View>
      <View style={placeholder.card}>
        <Text>{data.text}</Text>
      </View>
    </ScrollView>
  );
}
