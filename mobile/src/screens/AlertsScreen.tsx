import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { acknowledgeAlert, listAlerts } from "../api";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { placeholder } from "../theme/placeholder";
import type { Alert, DependentTabParamList, RiskLabel } from "../types";
import { errorMessage } from "../utils/errors";
import { formatWhen } from "../utils/format";

const RISK_COLOR: Record<RiskLabel, string> = {
  safe: "#1b7f3a",
  warning: "#c48a00",
  danger: "#b00020",
};

type Props = BottomTabScreenProps<DependentTabParamList, "Alerts">;

export function AlertsScreen({ route }: Props) {
  const { dependentId } = route.params;
  const load = useCallback(() => listAlerts(dependentId), [dependentId]);
  const alerts = useFocusedQuery(load);
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
    <ScrollView contentContainerStyle={placeholder.screen}>
      <Text style={placeholder.title}>Alerts</Text>
      {active.length === 0 ? <Text>No active alerts.</Text> : null}
      {actionError ? <Text style={placeholder.error}>{actionError}</Text> : null}
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
      <Pressable onPress={alerts.retry} style={placeholder.button}>
        <Text>Refresh</Text>
      </Pressable>
    </ScrollView>
  );
}

function AlertCard({
  alert,
  pending,
  onAcknowledge,
}: {
  alert: Alert;
  pending: boolean;
  onAcknowledge: () => void;
}) {
  const acknowledged = alert.status === "acknowledged";
  return (
    <View style={[placeholder.card, acknowledged ? styles.acknowledged : styles.active]}>
      <Text>{alert.product_name}</Text>
      <Text style={{ color: RISK_COLOR[alert.risk_label] }}>{alert.risk_label.toUpperCase()}</Text>
      <Text>{alert.message}</Text>
      <Text>{formatWhen(alert.created_at)}</Text>
      <Text>{acknowledged ? "Acknowledged" : "Active"}</Text>
      {acknowledged ? null : (
        <Pressable onPress={onAcknowledge} style={placeholder.button} disabled={pending}>
          {pending ? <ActivityIndicator /> : <Text>Acknowledge</Text>}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  active: {
    borderColor: "#b00020",
  },
  acknowledged: {
    borderColor: "#888888",
  },
});
