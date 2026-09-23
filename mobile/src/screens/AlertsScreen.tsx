import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { acknowledgeAlert, listAlerts } from "../api";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { placeholder } from "../theme/placeholder";
import type { DependentTabParamList } from "../types";
import { errorMessage } from "../utils/errors";
import { formatWhen } from "../utils/format";

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

  if (alerts.data.length === 0) {
    return (
      <ScreenStatus
        title="Alerts"
        message="No alerts for this dependent yet."
        actionLabel="Refresh"
        onAction={alerts.retry}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={placeholder.screen}>
      <Text style={placeholder.title}>Alerts</Text>
      {actionError ? <Text style={placeholder.error}>{actionError}</Text> : null}
      {alerts.data.map((alert) => (
        <View key={alert.id} style={placeholder.card}>
          <Text>{alert.message}</Text>
          <Text>
            {alert.status} · {formatWhen(alert.created_at)}
          </Text>
          {alert.status === "active" ? (
            <Pressable
              onPress={() => {
                void onAcknowledge(alert.id);
              }}
              style={placeholder.button}
              disabled={pendingId === alert.id}
            >
              {pendingId === alert.id ? <ActivityIndicator /> : <Text>Acknowledge</Text>}
            </Pressable>
          ) : null}
        </View>
      ))}
      <Pressable onPress={alerts.retry} style={placeholder.button}>
        <Text>Refresh</Text>
      </Pressable>
    </ScrollView>
  );
}
