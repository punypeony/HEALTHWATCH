import { Screen } from "../components/Screen";
import { QueryRefreshNotice } from "../components/QueryRefreshNotice";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback } from "react";

import { getWeeklySummary } from "../api";
import { OverviewCard } from "../components/OverviewCard";
import { Button } from "../components/Button";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { screen } from "../theme/screen";
import type { DependentTabParamList } from "../types";

type Props = BottomTabScreenProps<DependentTabParamList, "Summary">;

export function SummaryScreen({ route, navigation }: Props) {
  const { dependentId } = route.params;
  const load = useCallback(() => getWeeklySummary(dependentId), [dependentId]);
  const summary = useFocusedQuery(`dependent:${dependentId}:summary`, load);

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
    <Screen title="Overview" contentContainerStyle={screen.tabScroll}>
      <QueryRefreshNotice query={summary} />
      <OverviewCard summary={data} />
      <Button label="View scan history" onPress={() => navigation.navigate("History", { dependentId })} />
      <Button label="Refresh" variant="secondary" onPress={summary.retry} />
    </Screen>
  );
}
