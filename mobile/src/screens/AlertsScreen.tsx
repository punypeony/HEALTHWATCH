import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { acknowledgeAlert, listAlerts } from "../api";
import { Button } from "../components/Button";
import { RiskBadge } from "../components/RiskBadge";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { Alert, DependentTabParamList } from "../types";
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

  const active = alerts.data.filter((alert) => alert.status === "active");

  return (
    <ScrollView contentContainerStyle={screen.tabScroll}>
      {active.length === 0 ? <Text style={typography.body}>No active alerts.</Text> : null}
      {actionError ? <Text style={typography.error}>{actionError}</Text> : null}
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
      <Button label="Refresh" variant="secondary" onPress={alerts.retry} />
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
    <View
      style={{
        backgroundColor: acknowledged ? colors.acknowledged : colors.alertActive,
        borderRadius: radius.card,
        padding: spacing.sm,
        gap: spacing.xs,
      }}
    >
      <Text style={typography.section}>{alert.product_name}</Text>
      <RiskBadge label={alert.risk_label} />
      <Text style={typography.body}>{alert.message}</Text>
      <Text style={typography.body}>{formatWhen(alert.created_at)}</Text>
      <Text style={typography.muted}>{acknowledged ? "Acknowledged" : "Active"}</Text>
      {acknowledged ? null : (
        <Button label="Acknowledge" variant="save" onPress={onAcknowledge} pending={pending} />
      )}
    </View>
  );
}
