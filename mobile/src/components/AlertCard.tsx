import { Text } from "react-native";
import type { Alert } from "../types";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { formatWhen } from "../utils/format";
import { Button } from "./Button";
import { Card } from "./Card";
import { RiskBadge } from "./RiskBadge";
import { AlertStatus } from "./AlertStatus";

export function AlertCard({ alert, pending, onAcknowledge }: {
  alert: Alert; pending: boolean; onAcknowledge: () => void;
}) {
  const acknowledged = alert.status === "acknowledged";
  const backgroundColor = acknowledged || alert.risk_label === "safe" ? colors.white : colors[alert.risk_label];
  const borderColor = acknowledged || alert.risk_label === "safe" ? "#A3A3A3" : alert.risk_label === "warning" ? "#BF6A02" : "#EC221F";
  return (
    <Card style={{ backgroundColor, borderColor, borderRadius: 12, padding: 16, gap: 8 }}>
      <Text style={[typography.label, { fontSize: 17 }]}>{alert.product_name}</Text>
      <RiskBadge label={alert.risk_label} />
      <Text style={typography.body}>{alert.message}</Text>
      <Text style={typography.body}>{formatWhen(alert.created_at)}</Text>
      <AlertStatus status={alert.status} risk={alert.risk_label} />
      {acknowledged ? null : <Button label="Acknowledge" variant="save" pending={pending} onPress={onAcknowledge} />}
    </Card>
  );
}
