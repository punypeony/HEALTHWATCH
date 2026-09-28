import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import type { RiskLabel } from "../types";

const FILL: Record<RiskLabel, string> = {
  safe: colors.safe,
  warning: colors.warning,
  danger: colors.danger,
};

export function RiskBadge({ label }: { label: RiskLabel }) {
  return (
    <View style={[styles.badge, { backgroundColor: FILL[label] }]}>
      <Text style={typography.risk}>{label.toUpperCase()}</Text>
    </View>
  );
}

export function riskFill(label: RiskLabel): string {
  return FILL[label];
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.tab,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
