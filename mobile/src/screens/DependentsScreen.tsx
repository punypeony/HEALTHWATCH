import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { listDependents } from "../api";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { spacing } from "../theme/spacing";
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
    <Card>
      <Text style={typography.section}>{dependent.name}</Text>
      <Text style={typography.body}>
        {dependent.age} years · {dependent.sex}
      </Text>
      <Text style={typography.body}>Sodium {profile.daily_sodium_mg} mg</Text>
      <Text style={typography.body}>Calories {profile.daily_calories} kcal</Text>
      <Text style={typography.body}>Sugar {profile.daily_sugar_g} g</Text>
      {saturatedFat ? <Text style={typography.body}>Saturated fat {saturatedFat} g</Text> : null}
      <Button label="Open" onPress={onOpen} />
      <Button label="Edit" variant="secondary" onPress={onEdit} />
    </Card>
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

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
});
