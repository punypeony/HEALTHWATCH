import { Text } from "react-native";
import type { AlertStatus as Status, RiskLabel } from "../types";
import { typography } from "../theme/typography";
export function AlertStatus({ status, risk }: { status: Status; risk: RiskLabel }) {
  const color = status === "acknowledged" || risk === "safe" ? "#757575" : risk === "warning" ? "#975102" : "#C00F0C";
  return <Text style={[typography.label, { color }]}>{status === "active" ? "Active" : "Acknowledged"}</Text>;
}
