import { StyleSheet, Text, View } from "react-native";
import type { WeeklySummary } from "../types";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { Card } from "./Card";

export function OverviewCard({ summary }: { summary: WeeklySummary }) {
  return (
    <Card>
      <Text style={typography.label}>This week</Text>
      <View style={styles.counts}>
        {([
          ["Safe", summary.safe_count, colors.safe, "#009951"],
          ["Warning", summary.warning_count, colors.warning, "#975102"],
          ["Danger", summary.danger_count, colors.danger, "#C00F0C"],
        ] as const).map(([label, count, backgroundColor, color]) => (
          <View key={label} style={[styles.row, { backgroundColor, borderColor: color }]}>
            <Text style={[typography.label, { color }]}>{label}</Text>
            <Text style={typography.body}>{count}</Text>
          </View>
        ))}
        <Text style={typography.body}>Total scans: {summary.total_scans}</Text>
        <Text style={typography.body}>Common reason: {summary.common_reason ?? "None"}</Text>
      </View>
      <Text style={typography.label}>Weekly summary</Text>
      <Text style={typography.body}>{summary.text}</Text>
    </Card>
  );
}
const styles = StyleSheet.create({
  counts: { padding: 12, gap: 7, borderWidth: 1, borderColor: "#8FA5A7", borderRadius: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, borderWidth: 1, borderRadius: 6 },
});
