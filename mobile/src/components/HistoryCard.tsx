import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { MealLog } from "../types";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { formatWhen, nutritionBasis, twoDecimals } from "../utils/format";
import { Card } from "./Card";
import { DesignIcon } from "./DesignIcon";

export function HistoryCard({ meal, onDelete }: { meal: MealLog; onDelete: () => void }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const color = meal.risk_label === "safe" ? "#009951" : meal.risk_label === "warning" ? "#975102" : "#C00F0C";
  const amount = (value: number, unit: string) => meal.grams_eaten != null && meal.grams_eaten > 0
    ? `${twoDecimals(value * meal.grams_eaten / 100)} ${unit} eaten` : `${twoDecimals(value)} ${unit}`;
  return (
    <Card style={[styles.card, { backgroundColor: colors[meal.risk_label], borderColor: color }]}>
      <View style={styles.row}>
        <DesignIcon name={meal.risk_label} size={36} color={color} />
        <View style={styles.heading}>
          <Text style={typography.label}>{meal.product_name}</Text>
          <Text style={[typography.body, { color }]}>{meal.risk_label === "safe" ? "Safe" : meal.risk_label === "warning" ? "Warning" : "Danger"}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Delete scan for ${meal.product_name}`} onPress={onDelete} style={styles.delete}>
          <View style={[styles.deleteCircle, { borderColor: color }]}><DesignIcon name="minus" size={16} color={color} /></View>
        </Pressable>
      </View>
      {meal.image_url && !photoFailed ? <Image source={{ uri: meal.image_url }} onError={() => setPhotoFailed(true)} accessibilityLabel="Product photo" style={styles.photo} /> : null}
      <Text style={typography.body}>{nutritionBasis(meal.barcode)}</Text>
      <Text style={typography.body}>Sodium {amount(meal.sodium_mg, "mg")} · Calories {amount(meal.calories, "kcal")} · Sugar {amount(meal.sugar_g, "g")}</Text>
      {meal.risk_reasons.map((reason, index) => <Text key={index} style={typography.body}>{reason}</Text>)}
      <Text style={typography.body}>{formatWhen(meal.created_at)}</Text>
    </Card>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 14, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  heading: { flex: 1, gap: 3 },
  delete: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  deleteCircle: { width: 26, height: 26, borderWidth: 1, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  photo: { width: 56, height: 56, borderRadius: 10 },
});
