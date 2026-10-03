import { Screen } from "../components/Screen";
import { QueryRefreshNotice } from "../components/QueryRefreshNotice";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Text } from "react-native";

import { getWeeklySummary, listDependents } from "../api";
import { readQuery, refreshQuery } from "../utils/queryCache";
import { ActionBar } from "../components/ActionBar";
import { DependentCard } from "../components/DependentCard";
import { Card } from "../components/Card";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { AppStackParamList } from "../types";

type Props = NativeStackScreenProps<AppStackParamList, "Dependents">;

export function DependentsScreen({ navigation }: Props) {
  const load = useCallback(() => listDependents(), []);
  const dependents = useFocusedQuery("dependents", load);
  const data = dependents.status === "success" ? dependents.data : undefined;
  useFocusEffect(useCallback(() => {
    let active = true;
    const queue = [...(data ?? [])];
    async function warmOverview() {
      while (active && queue.length) {
        const dependent = queue.shift()!;
        const key = `dependent:${dependent.id}:summary`;
        if (!readQuery(key).hasData) {
          await refreshQuery(key, () => getWeeklySummary(dependent.id));
        }
      }
    }
    // Limit prefetch concurrency so a large household cannot flood the API.
    void warmOverview();
    void warmOverview();
    return () => { active = false; };
  }, [data]));

  if (dependents.status === "loading") {
    return <ScreenStatus title="Dependents" message="Loading dependents..." loading />;
  }

  if (dependents.status === "error") {
    return (
      <ScreenStatus
        title="Dependents"
        message={dependents.message}
        actionLabel="Retry"
        onAction={dependents.retry}
      />
    );
  }

  return (
    <Screen contentContainerStyle={screen.scroll} footer={<ActionBar onAdd={() => navigation.navigate("DependentForm")} onRefresh={dependents.retry} />}>
      <QueryRefreshNotice query={dependents} />
      {dependents.data.length === 0 ? <Card><Text style={typography.section}>Your dependents</Text><Text style={typography.body}>No dependents yet. Add a relative to start monitoring their food.</Text></Card> : null}
      {dependents.data.map((dependent) => (
        <DependentCard
          key={dependent.id}
          dependent={dependent}
          onOpen={() =>
            navigation.navigate("Dependent", {
              dependentId: dependent.id,
              dependentName: dependent.name,
            })
          }
          onEdit={() => navigation.navigate("DependentForm", { dependentId: dependent.id })}
        />
      ))}
    </Screen>
  );
}
