import { Screen } from "../components/Screen";
import { NavigationBar } from "../components/NavigationBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { createDependent, deleteDependent, getDependent, updateDependent } from "../api";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { ScreenStatus } from "../components/ScreenStatus";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { AppStackParamList, DietaryProfile, Sex } from "../types";
import { errorMessage } from "../utils/errors";

type Props = NativeStackScreenProps<AppStackParamList, "DependentForm">;

const ALLERGY_SHORTCUTS = [
  ["Milk", "milk"],
  ["Soy", "soy"],
  ["Peanut", "peanut"],
  ["Nuts", "nuts"],
  ["Gluten", "gluten"],
  ["Wheat", "wheat"],
  ["Egg", "egg"],
  ["Fish", "fish"],
  ["Crustaceans", "crustaceans"],
  ["Molluscs", "molluscs"],
  ["Celery", "celery"],
  ["Mustard", "mustard"],
  ["Sesame", "sesame-seeds"],
  ["Sulphites", "sulphur-dioxide-and-sulphites"],
  ["Lupin", "lupin"],
  ["Corn", "corn"],
] as const;

const STORED_ALLERGY: Record<string, string> = {
  sesame: "sesame-seeds",
  sulphites: "sulphur-dioxide-and-sulphites",
  sulfites: "sulphur-dioxide-and-sulphites",
  mollusks: "molluscs",
};

function canonicalAllergy(value: string): string {
  const trimmed = value.trim();
  return STORED_ALLERGY[trimmed.toLowerCase()] ?? trimmed;
}

function allergyLabel(value: string): string {
  const found = ALLERGY_SHORTCUTS.find(([, stored]) => stored === value.trim().toLowerCase());
  return found ? found[0] : value;
}

function normalizeAllergies(values: string[]): string[] {
  const unique: string[] = [];
  for (const value of values) {
    const parts = value.trim().toLowerCase() === "gluten/wheat" ? ["gluten", "wheat"] : [value.trim()];
    for (const part of parts) {
      const stored = canonicalAllergy(part);
      if (stored && !unique.some((item) => item.toLowerCase() === stored.toLowerCase())) {
        unique.push(stored);
      }
    }
  }
  return unique;
}

const TRACKED_CONDITIONS = new Set([
  "diabetic",
  "hypertension",
  "high cholesterol",
  "kidney disease",
]);

function parseAge(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed > 120) {
    return null;
  }
  return parsed;
}

function parseMeasurement(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 99999.99) {
    return null;
  }
  return parsed;
}

function hasCondition(conditions: string[], name: string): boolean {
  return conditions.some((condition) => condition.toLowerCase() === name);
}

export function DependentFormScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const dependentId = route.params?.dependentId;
  const [attempt, setAttempt] = useState(0);
  const [loadStatus, setLoadStatus] = useState<"loading" | "error" | "ready">(
    dependentId ? "loading" : "ready",
  );
  const [loadMessage, setLoadMessage] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [sex, setSex] = useState<Sex | null>(null);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [diabetic, setDiabetic] = useState(false);
  const [hypertension, setHypertension] = useState(false);
  const [highCholesterol, setHighCholesterol] = useState(false);
  const [kidneyDisease, setKidneyDisease] = useState(false);
  const [extraConditions, setExtraConditions] = useState<string[]>([]);
  const [profile, setProfile] = useState<DietaryProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!dependentId) {
      return;
    }

    let cancelled = false;
    setLoadStatus("loading");

    getDependent(dependentId)
      .then((dependent) => {
        if (cancelled) {
          return;
        }
        const conditions = dependent.dietary_profile.conditions;
        setName(dependent.name);
        setAge(String(dependent.age));
        setHeightCm(String(dependent.height_cm));
        setWeightKg(String(dependent.weight_kg));
        setSex(dependent.sex);
        setAllergies(normalizeAllergies(dependent.dietary_profile.allergies));
        setDiabetic(hasCondition(conditions, "diabetic"));
        setHypertension(hasCondition(conditions, "hypertension"));
        setHighCholesterol(hasCondition(conditions, "high cholesterol"));
        setKidneyDisease(hasCondition(conditions, "kidney disease"));
        setExtraConditions(
          conditions.filter((condition) => !TRACKED_CONDITIONS.has(condition.toLowerCase())),
        );
        setProfile(dependent.dietary_profile);
        setLoadStatus("ready");
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadMessage(errorMessage(error));
          setLoadStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, dependentId]);

  function toggleAllergy(label: string) {
    setAllergies((current) => {
      const exists = current.some((item) => item.toLowerCase() === label.toLowerCase());
      if (exists) {
        return current.filter((item) => item.toLowerCase() !== label.toLowerCase());
      }
      return [...current, label];
    });
  }

  function onDelete() {
    if (!dependentId) {
      return;
    }
    Alert.alert("Delete dependent", "This removes the dependent and their records.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setDeleting(true);
          setFormError(null);
          void deleteDependent(dependentId)
            .then(() => navigation.popToTop())
            .catch((error: unknown) => setFormError(errorMessage(error)))
            .finally(() => setDeleting(false));
        },
      },
    ]);
  }

  async function onSubmit() {
    const trimmedName = name.trim();
    const parsedAge = parseAge(age);
    const parsedHeight = parseMeasurement(heightCm);
    const parsedWeight = parseMeasurement(weightKg);

    if (!trimmedName) {
      setFormError("Enter a name.");
      return;
    }
    if (trimmedName.length > 200) {
      setFormError("Name must be 200 characters or fewer.");
      return;
    }
    if (parsedAge === null) {
      setFormError("Enter a whole-number age from 0 to 120.");
      return;
    }
    if (parsedHeight === null) {
      setFormError("Enter a height in centimeters greater than 0, with at most two decimal places.");
      return;
    }
    if (parsedWeight === null) {
      setFormError("Enter a weight in kilograms greater than 0, with at most two decimal places.");
      return;
    }
    if (!sex) {
      setFormError("Select male or female.");
      return;
    }

    const savedAllergies = normalizeAllergies(allergies);
    const input = {
      name: trimmedName,
      age: parsedAge,
      height_cm: parsedHeight,
      weight_kg: parsedWeight,
      sex,
      allergies: savedAllergies,
      conditions: [
        ...extraConditions,
        ...(diabetic ? ["diabetic"] : []),
        ...(hypertension ? ["hypertension"] : []),
        ...(highCholesterol ? ["high cholesterol"] : []),
        ...(kidneyDisease ? ["kidney disease"] : []),
      ],
    };

    setSubmitting(true);
    setFormError(null);
    try {
      if (dependentId) {
        await updateDependent(dependentId, input);
      } else {
        await createDependent(input);
      }
      navigation.goBack();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadStatus === "loading") {
    return <ScreenStatus title="Dependent" message="Loading dependent..." loading />;
  }

  if (loadStatus === "error") {
    return (
      <ScreenStatus
        title="Dependent"
        message={loadMessage}
        actionLabel="Retry"
        onAction={() => setAttempt((value) => value + 1)}
      />
    );
  }

  return (
    <Screen
      footer={dependentId ? <NavigationBar current="" bottomInset={insets.bottom} floating={false}
        onSelect={tab => {
          if (tab === "Home") { navigation.popToTop(); return; }
          navigation.navigate("Dependent", { dependentId, dependentName: name, screen: tab, params: { dependentId } });
        }} /> : <View style={{ padding: 16, paddingBottom: Math.max(insets.bottom, 16) }}><Button label="Home" onPress={() => navigation.popToTop()} /></View>}
      contentContainerStyle={screen.scroll}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Card>
      <Text style={typography.body}>
        Daily targets are calculated automatically from age, height, weight, sex, and recorded
        conditions. They are not entered by hand.
      </Text>
      {profile ? (
        <Card>
          <Text style={[typography.label, { color: colors.calorie }]}>
            {profile.daily_calories} kcal
          </Text>
          <Text style={[typography.label, { color: colors.sodium }]}>
            {profile.daily_sodium_mg} mg sodium
          </Text>
          <Text style={[typography.label, { color: colors.sugar }]}>{profile.daily_sugar_g} g sugar</Text>
        </Card>
      ) : null}
      <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
      <Field label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" />
      <Field
        label="Height (cm)"
        value={heightCm}
        onChangeText={setHeightCm}
        keyboardType="decimal-pad"
      />
      <Field
        label="Weight (kg)"
        value={weightKg}
        onChangeText={setWeightKg}
        keyboardType="decimal-pad"
      />
      <View style={{ gap: spacing.xs }}>
        <Text style={typography.label}>Sex</Text>
        <View style={{ flexDirection: "row", borderRadius: radius.pill, overflow: "hidden", borderWidth: 1, borderColor: "#B8BEC5" }}>
          {(["male", "female"] as const).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked: sex === option }}
              onPress={() => setSex(option)}
              style={{
                flex: 1,
                backgroundColor: sex === option ? (option === "male" ? "#CDE8FF" : "#FAD7E5") : colors.white,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={[typography.buttonDark, sex === option && { fontWeight: "700", color: option === "male" ? "#245B85" : "#863B59" }]}>
                {option === "male" ? "Male" : "Female"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Text style={typography.label}>Allergies</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        <Pressable
          onPress={() => setAllergies([])}
          style={{
            backgroundColor: allergies.length === 0 ? colors.tealSoft : colors.white,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: colors.teal,
            minHeight: 44,
            justifyContent: "center",
            paddingHorizontal: spacing.md,
          }}
        >
          <Text style={[typography.buttonDark, allergies.length === 0 && { color: colors.forest, fontWeight: "700" }]}>No known allergies</Text>
        </Pressable>
        {ALLERGY_SHORTCUTS.map(([label, value]) => {
          const selected = allergies.some((item) => item.toLowerCase() === value);
          return (
            <Pressable
              key={label}
              onPress={() => toggleAllergy(value)}
              style={{
                backgroundColor: selected ? colors.tealSoft : colors.white,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.teal,
                minHeight: 44,
                justifyContent: "center",
                paddingHorizontal: spacing.md,
              }}
            >
              <Text style={[typography.buttonDark, selected && { color: colors.forest, fontWeight: "700" }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      {allergies.length > 0 ? (
        <Text style={typography.body}>
          Selected: {allergies.map(allergyLabel).join(", ")}. Tap a chip again to remove it.
        </Text>
      ) : null}
      <Text style={typography.label}>Conditions</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {(
          [
            ["Diabetic", diabetic, setDiabetic],
            ["Hypertension", hypertension, setHypertension],
            ["High cholesterol", highCholesterol, setHighCholesterol],
            ["Kidney disease", kidneyDisease, setKidneyDisease],
          ] as const
        ).map(([label, checked, setChecked]) => (
          <Pressable
            key={label}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel={label}
            onPress={() => setChecked((value) => !value)}
            style={{
              backgroundColor: checked ? colors.tealSoft : colors.white,
              borderWidth: 1,
              borderColor: colors.teal,
              borderRadius: radius.pill,
              minHeight: 44,
              justifyContent: "center",
              paddingHorizontal: spacing.md,
            }}
          >
            <Text style={[typography.buttonDark, checked && { color: colors.forest, fontWeight: "700" }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {extraConditions.length > 0 ? (
        <Text style={typography.body}>Other recorded conditions: {extraConditions.join(", ")}</Text>
      ) : null}
      {formError ? <Text style={typography.error}>{formError}</Text> : null}
      <Button
        label={dependentId ? "Save Changes" : "Add dependent"}
        variant={dependentId ? "muted" : "save"}
        onPress={() => void onSubmit()}
        pending={submitting}
        disabled={deleting}
      />
      {dependentId ? (
        <Button label="Delete Dependent" variant="danger" onPress={onDelete} pending={deleting} disabled={submitting} />
      ) : null}
      </Card>
    </Screen>
  );
}
