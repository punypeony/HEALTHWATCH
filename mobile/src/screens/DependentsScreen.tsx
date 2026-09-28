import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { listDependents } from "../api";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { AppStackParamList, Dependent } from "../types";

type Props = NativeStackScreenProps<AppStackParamList, "Dependents">;

export function DependentsScreen({ navigation }: Props) {
  const load = useCallback(() => listDependents(), []);
  const dependents = useFocusedQuery(load);

  if (dependents.status === "loading") {
    return <ScreenStatus title="Dependents" message="Loading dependents..." loading />;
  }

  if (dependents.status === "error") {
    return (
      <ScreenStatus
        title="Dependents"
        message={dependents.message}
        actionLabel="Retry"
        onAction={dependents.retry}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={screen.scroll}>
      {dependents.data.length === 0 ? <Text style={typography.body}>No dependents yet.</Text> : null}
      {dependents.data.map((dependent) => (
        <DependentRow
          key={dependent.id}
          dependent={dependent}
          onOpen={() =>
            navigation.navigate("Dependent", {
              dependentId: dependent.id,
              dependentName: dependent.name,
            })
          }
          onEdit={() => navigation.navigate("DependentForm", { dependentId: dependent.id })}
        />
      ))}
      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <Button label="Add dependent" onPress={() => navigation.navigate("DependentForm")} />
        </View>
        <View style={styles.footerButton}>
          <Button label="Refresh" variant="secondary" onPress={dependents.retry} />
        </View>
      </View>
    </ScrollView>
  );
}

function DependentRow({
  dependent,
  onOpen,
  onEdit,
}: {
  dependent: Dependent;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const profile = dependent.dietary_profile;
  const saturatedFat = saturatedFatGrams(profile.conditions, profile.daily_calories);
  return (
    <View>
      <View style={styles.tab}>
        <Text style={styles.tabText}>{dependent.name}</Text>
      </View>
      <Card style={styles.person}>
        <View style={styles.row}>
          <View style={styles.avatar} />
          <View style={styles.limits}>
            <Limit label="Sodium" value={`${profile.daily_sodium_mg} mg`} color={colors.sodium} />
            <Limit label="Calories" value={`${profile.daily_calories} kcal`} color={colors.calorie} />
            {saturatedFat ? (
              <Limit label="Saturated fat" value={`${saturatedFat} g`} color={colors.saturatedFat} />
            ) : (
              <View style={styles.limit} />
            )}
            <Limit label="Sugar" value={`${profile.daily_sugar_g} g`} color={colors.sugar} />
          </View>
        </View>
        <Text style={typography.body}>
          {dependent.age} years · {dependent.sex}
        </Text>
        <View style={styles.actions}>
          <Pressable onPress={onOpen} style={styles.action}>
            <Text style={typography.button}>Open</Text>
          </Pressable>
          <Pressable onPress={onEdit} style={styles.actionSecondary}>
            <Text style={typography.buttonDark}>Edit</Text>
          </Pressable>
        </View>
      </Card>
    </View>
  );
}

function saturatedFatGrams(conditions: string[], calories: number): string | null {
  // Same daily target as the backend: 10% of calories, 9 kcal per gram. Shown only when high cholesterol is recorded.
  const recorded = conditions.some((condition) => condition.toLowerCase() === "high cholesterol");
  if (!recorded || !(calories > 0)) {
    return null;
  }
  const grams = (0.1 * calories) / 9;
  return grams.toFixed(1);
}

function Limit({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.limit}>
      <Text style={[typography.label, { color }]}>{label}</Text>
      <Text style={typography.body}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tab: {
    alignSelf: "flex-start",
    backgroundColor: colors.tealSoft,
    borderTopLeftRadius: radius.tab,
    borderTopRightRadius: radius.tab,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tabText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "500",
  },
  person: {
    borderTopLeftRadius: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 67,
    height: 67,
    borderRadius: radius.avatar,
    backgroundColor: colors.avatar,
  },
  limits: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  limit: {
    width: "50%",
    paddingVertical: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    flex: 1,
    backgroundColor: colors.teal,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  actionSecondary: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.teal,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
