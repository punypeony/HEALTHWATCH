import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { MealLog } from "../types";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { formatScanTime, nutritionBasis, twoDecimals } from "../utils/format";
import { Card } from "./Card";
import { DesignIcon } from "./DesignIcon";

export function HistoryCard({ meal, onDelete }: { meal: MealLog; onDelete: () => void }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const color = meal.risk_label === "safe" ? "#009951" : meal.risk_label === "warning" ? "#975102" : "#C00F0C";
  const grams = meal.grams_eaten ?? 0;
  const eaten = grams > 0;
  const shown = (value: number) => twoDecimals(eaten ? value * grams / 100 : value);
  const nutrients = [
    { key: "calories", text: `Calories ${shown(meal.calories)} kcal`, color: colors.calorie },
    { key: "sodium", text: `Sodium ${shown(meal.sodium_mg)} mg`, color: colors.sodium },
    { key: "sugar", text: `Sugar ${shown(meal.sugar_g)} g`, color: colors.sugar },
  ];
  if (meal.carbohydrate_g != null) {
    nutrients.push({ key: "carbohydrate", text: `Carbohydrate ${shown(meal.carbohydrate_g)} g`, color: "#245B85" });
  }
  if (meal.saturated_fat_g != null) {
    nutrients.push({ key: "saturatedFat", text: `Saturated fat ${shown(meal.saturated_fat_g)} g`, color: colors.saturatedFat });
  }
  if (meal.protein_g != null) {
    nutrients.push({ key: "protein", text: `Protein ${shown(meal.protein_g)} g`, color: "#42652A" });
  }
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
      {eaten ? (
        <View style={styles.eaten}>
          <Text style={styles.eatenText}>Eaten · {twoDecimals(grams)} g</Text>
        </View>
      ) : null}
      <View style={styles.basis}>
        <Text style={styles.basisText}>{nutritionBasis(meal.barcode)}</Text>
      </View>
      <Text style={typography.body}>
        {nutrients.map((nutrient, index) => (
          <Text key={nutrient.key}>
            {index > 0 ? " · " : ""}
            <Text style={{ color: nutrient.color }}>{nutrient.text}</Text>
          </Text>
        ))}
      </Text>
      {meal.risk_reasons.map((reason, index) => <Text key={index} style={typography.body}>{reason}</Text>)}
      <Text style={[typography.muted, styles.when]}>{formatScanTime(meal.created_at)}</Text>
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
  basis: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F6EE",
    borderColor: "#027A48",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  basisText: {
    color: "#02542D",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  eaten: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#027A48",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  eatenText: {
    color: "#02542D",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  when: { marginTop: 8 },
});
