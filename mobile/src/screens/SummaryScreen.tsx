import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback } from "react";
import { ScrollView, Text } from "react-native";

import { getWeeklySummary } from "../api";
import { Card } from "../components/Card";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { colors } from "../theme/colors";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { DependentTabParamList } from "../types";

type Props = BottomTabScreenProps<DependentTabParamList, "Summary">;

export function SummaryScreen({ route }: Props) {
  const { dependentId } = route.params;
  const load = useCallback(() => getWeeklySummary(dependentId), [dependentId]);
  const summary = useFocusedQuery(load);

  if (summary.status === "loading") {
    return <ScreenStatus title="Summary" message="Loading weekly summary..." loading />;
  }

  if (summary.status === "error") {
    return (
      <ScreenStatus
        title="Summary"
        message={summary.message}
        actionLabel="Retry"
        onAction={summary.retry}
      />
    );
  }

  const data = summary.data;
  return (
    <ScrollView contentContainerStyle={screen.tabScroll}>
      <Card>
        <Text style={[typography.label, { color: colors.safe }]}>Safe: {data.safe_count}</Text>
        <Text style={[typography.label, { color: colors.sodium }]}>Warning: {data.warning_count}</Text>
        <Text style={[typography.label, { color: colors.sugar }]}>Danger: {data.danger_count}</Text>
        <Text style={typography.body}>Total scans: {data.total_scans}</Text>
        <Text style={typography.body}>Common reason: {data.common_reason ?? "None"}</Text>
      </Card>
      <Card>
        <Text style={typography.body}>{data.text}</Text>
      </Card>
    </ScrollView>
  );
}
