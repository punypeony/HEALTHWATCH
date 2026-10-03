import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { RiskLabel } from "../types";
import { DesignIcon } from "./DesignIcon";

const FILL: Record<RiskLabel, string> = {
  safe: colors.safe,
  warning: colors.warning,
  danger: colors.danger,
};

export function RiskBadge({ label }: { label: RiskLabel }) {
  const text = { safe: "Low Risk", warning: "Moderate Risk", danger: "High Risk" }[label];
  const fill = { safe: colors.safe, warning: "#E8B931", danger: "#EC221F" }[label];
  const color = label === "danger" ? colors.white : label === "warning" ? "#754000" : colors.forest;
  return (
    <View accessibilityLabel={`${text}: ${label}`} style={[styles.badge, { backgroundColor: fill }]}>
      <DesignIcon name={label} size={15} color={color} />
      <Text style={[typography.label, { color, fontSize: 12 }]}>{text}</Text>
    </View>
  );
}

export function riskFill(label: RiskLabel): string {
  return FILL[label];
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.tab,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
