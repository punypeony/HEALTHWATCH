import { Screen } from "../components/Screen";
import { QueryRefreshNotice } from "../components/QueryRefreshNotice";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback, useState } from "react";
import { Text } from "react-native";

import { acknowledgeAlert, listAlerts } from "../api";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { AlertCard } from "../components/AlertCard";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { DependentTabParamList } from "../types";
import { errorMessage } from "../utils/errors";

type Props = BottomTabScreenProps<DependentTabParamList, "Alerts">;

export function AlertsScreen({ route }: Props) {
  const { dependentId } = route.params;
  const load = useCallback(() => listAlerts(dependentId), [dependentId]);
  const alerts = useFocusedQuery(`dependent:${dependentId}:alerts`, load);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onAcknowledge(id: number) {
    setPendingId(id);
    setActionError(null);
    try {
      await acknowledgeAlert(id);
      alerts.retry();
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setPendingId(null);
    }
  }

  if (alerts.status === "loading") {
    return <ScreenStatus title="Alerts" message="Loading alerts..." loading />;
  }

  if (alerts.status === "error") {
    return (
      <ScreenStatus title="Alerts" message={alerts.message} actionLabel="Retry" onAction={alerts.retry} />
    );
  }

  const active = alerts.data.filter((alert) => alert.status === "active");

  return (
    <Screen title="Alerts" contentContainerStyle={screen.tabScroll}>
      <QueryRefreshNotice query={alerts} />
      {active.length === 0 ? <Card><Text style={typography.body}>No active alerts.</Text></Card> : null}
      {actionError ? <Text style={typography.error}>{actionError}</Text> : null}
      <Card>
      {alerts.data.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          pending={pendingId === alert.id}
          onAcknowledge={() => {
            void onAcknowledge(alert.id);
          }}
        />
      ))}
      </Card>
      <Button label="Refresh" variant="secondary" onPress={alerts.retry} />
    </Screen>
  );
}
