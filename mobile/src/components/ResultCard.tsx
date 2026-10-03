import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ScanResult } from "../types";
import { typography } from "../theme/typography";
import { Card } from "./Card";
import { RiskBadge } from "./RiskBadge";

/** Results panel: callers provide nutrient detail and existing eaten actions. */
export function ResultCard({ result, children }: PropsWithChildren<{ result: ScanResult }>) {
  return (
    <Card>
      <RiskBadge label={result.risk_label} />
      <Text style={typography.section}>{result.product.name}</Text>
      {result.matched_allergens?.length ? <View style={styles.allergies}>
        <Text style={styles.warning}>Matches recorded allergies</Text>
        <View style={styles.chips}>{result.matched_allergens.map(allergen => (
          <Text key={allergen} accessibilityLabel={`Matching allergen: ${allergen}`} style={styles.chip}>{allergen}</Text>
        ))}</View>
      </View> : null}
      <Text style={typography.label}>Why?</Text>
      {result.reasons.map((reason, index) => <Text key={index} style={typography.body}>• {reason}</Text>)}
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  allergies: { gap: 8 },
  warning: { fontSize: 15, fontWeight: "700", color: "#A51C25" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#FFE1DE", color: "#8F1720", borderColor: "#B3261E", borderWidth: 1, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, fontSize: 15, fontWeight: "700" },
});
