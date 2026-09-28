import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { createDependent, getDependent, updateDependent } from "../api";
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
  const [allergyDraft, setAllergyDraft] = useState("");
  const [diabetic, setDiabetic] = useState(false);
  const [hypertension, setHypertension] = useState(false);
  const [highCholesterol, setHighCholesterol] = useState(false);
  const [kidneyDisease, setKidneyDisease] = useState(false);
  const [extraConditions, setExtraConditions] = useState<string[]>([]);
  const [profile, setProfile] = useState<DietaryProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
        setAllergies(dependent.dietary_profile.allergies);
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

  const addAllergy = useCallback(() => {
    const label = allergyDraft.trim();
    if (!label) {
      return;
    }
    if (label.length > 100) {
      setFormError("Allergy labels must be 100 characters or fewer.");
      return;
    }
    setFormError(null);
    setAllergies((current) => {
      if (current.some((item) => item.toLowerCase() === label.toLowerCase())) {
        return current;
      }
      return [...current, label];
    });
    setAllergyDraft("");
  }, [allergyDraft]);

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

    const input = {
      name: trimmedName,
      age: parsedAge,
      height_cm: parsedHeight,
      weight_kg: parsedWeight,
      sex,
      allergies,
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
    <ScrollView contentContainerStyle={screen.scroll} keyboardShouldPersistTaps="handled">
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
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {(["male", "female"] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setSex(option)}
              style={{
                backgroundColor: sex === option ? colors.teal : colors.white,
                borderWidth: 1,
                borderColor: colors.teal,
                borderRadius: radius.pill,
                minHeight: 44,
                justifyContent: "center",
                paddingHorizontal: spacing.md,
              }}
            >
              <Text style={sex === option ? typography.button : typography.buttonDark}>{option}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Field
        label="Allergy"
        value={allergyDraft}
        onChangeText={setAllergyDraft}
        autoCapitalize="none"
        onSubmitEditing={addAllergy}
      />
      <Button label="Add allergy" variant="secondary" onPress={addAllergy} disabled={submitting} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {allergies.map((allergy) => (
          <Pressable
            key={allergy}
            onPress={() => setAllergies((current) => current.filter((item) => item !== allergy))}
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.pill,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <Text style={typography.body}>{allergy} (remove)</Text>
          </Pressable>
        ))}
      </View>
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
          <Text style={checked ? typography.button : typography.buttonDark}>
            {checked ? "[x]" : "[ ]"} {label}
          </Text>
        </Pressable>
      ))}
      {extraConditions.length > 0 ? (
        <Text style={typography.body}>Other recorded conditions: {extraConditions.join(", ")}</Text>
      ) : null}
      {formError ? <Text style={typography.error}>{formError}</Text> : null}
      <Button
        label={dependentId ? "Save changes" : "Add dependent"}
        onPress={() => void onSubmit()}
        pending={submitting}
      />
    </ScrollView>
  );
}
