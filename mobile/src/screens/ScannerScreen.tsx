import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, getDailyIntake, markMealEaten, scanDependent } from "../api";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { RiskBadge } from "../components/RiskBadge";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { colors } from "../theme/colors";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { DependentTabParamList, IntakeNutrient, ScanResult } from "../types";
import { errorMessage } from "../utils/errors";
import { nutritionBasis, twoDecimals } from "../utils/format";

const SCAN_COOLDOWN_MS = 1500;

type Lookup =
  | { source: "barcode"; value: string }
  | { source: "dish"; value: string };

type ScanPhase =
  | { kind: "scan" }
  | { kind: "manual" }
  | { kind: "loading"; lookup: Lookup }
  | { kind: "result"; result: ScanResult }
  | { kind: "error"; lookup: Lookup; title: string; message: string; canRetry: boolean };

type Props = BottomTabScreenProps<DependentTabParamList, "Scan">;

function isBarcode(value: string): boolean {
  return /^[0-9]{8,14}$/.test(value);
}

function failurePhase(error: unknown, lookup: Lookup): ScanPhase {
  if (error instanceof ApiError && error.code === "PRODUCT_NOT_FOUND") {
    return {
      kind: "error",
      lookup,
      title: "Product not found",
      message: error.message,
      canRetry: false,
    };
  }
  if (error instanceof ApiError && (error.code === "NETWORK_ERROR" || error.status === 0)) {
    return {
      kind: "error",
      lookup,
      title: "Network failure",
      message: error.message,
      canRetry: true,
    };
  }
  const message = errorMessage(error);
  const missingCarb = message.startsWith("Carbohydrate per 100 g is missing");
  return {
    kind: "error",
    lookup,
    title: "Scan failed",
    message: missingCarb
      ? `${message} Spaghetti and pork adobo have no carbohydrate value in the saved table, so a diabetic dependent cannot be classified from them. The value is not stored as zero.`
      : message,
    canRetry: !missingCarb,
  };
}

export function ScannerScreen({ route }: Props) {
  const { dependentId } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScanPhase>({ kind: "scan" });
  const [draft, setDraft] = useState("");
  const [dishDraft, setDishDraft] = useState("");
  const [askingEaten, setAskingEaten] = useState(false);
  const [gramsDraft, setGramsDraft] = useState("");
  const [eatenNote, setEatenNote] = useState<string | null>(null);
  const [eatenSaved, setEatenSaved] = useState(false);
  const lastScanAt = useRef(0);
  const busy = useRef(false);

  async function submitLookup(lookup: Lookup) {
    if (lookup.source === "barcode" && !isBarcode(lookup.value)) {
      busy.current = false;
      setPhase({
        kind: "error",
        lookup,
        title: "Invalid barcode",
        message: "Barcode must contain 8 to 14 digits.",
        canRetry: false,
      });
      return;
    }
    if (lookup.source === "dish" && !lookup.value.trim()) {
      busy.current = false;
      setPhase({
        kind: "error",
        lookup,
        title: "Invalid dish",
        message: "Enter a dish name.",
        canRetry: false,
      });
      return;
    }

    busy.current = true;
    setPhase({ kind: "loading", lookup });
    try {
      const result = await scanDependent(
        dependentId,
        lookup.source === "barcode" ? { barcode: lookup.value } : { dish_name: lookup.value },
      );
      setAskingEaten(false);
      setEatenSaved(false);
      setEatenNote(null);
      setGramsDraft(result.serving_grams != null ? String(result.serving_grams) : "");
      setPhase({ kind: "result", result });
    } catch (error) {
      setPhase(failurePhase(error, lookup));
    } finally {
      busy.current = false;
    }
  }

  function scanAgain() {
    setDraft("");
    setDishDraft("");
    setAskingEaten(false);
    setEatenSaved(false);
    setEatenNote(null);
    setPhase({ kind: "scan" });
  }

  async function confirmEaten(mealId: number) {
    const grams = Number(gramsDraft);
    if (!gramsDraft.trim() || Number.isNaN(grams) || grams <= 0) {
      setEatenNote("Enter the grams eaten. The amount must be greater than zero.");
      return;
    }
    setEatenNote(null);
    try {
      await markMealEaten(mealId, grams);
      setAskingEaten(false);
      setEatenSaved(true);
      setEatenNote("Recorded as eaten.");
    } catch (error) {
      setEatenNote(errorMessage(error));
    }
  }

  if (!permission) {
    return <ScreenStatus title="Scan" message="Checking camera permission..." loading />;
  }

  if (phase.kind === "loading") {
    return (
      <ScreenStatus
        title="Scan"
        message={
          phase.lookup.source === "barcode"
            ? `Looking up barcode ${phase.lookup.value}...`
            : `Looking up ${phase.lookup.value}...`
        }
        loading
      />
    );
  }

  if (phase.kind === "result") {
    const { result } = phase;
    return (
      <ScrollView
        contentContainerStyle={screen.tabScroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <RiskBadge label={result.risk_label} />
        <Text
          style={{
            fontSize: 22,
            lineHeight: 28,
            fontWeight: "700",
            color: colors.ink,
          }}
        >
          {result.product.name}
        </Text>
        <Card>
          <Text style={typography.label}>Why?</Text>
          {result.reasons.map((reason, index) => (
            <Text key={`${result.meal_log_id}-${index}`} style={typography.body}>
              • {reason}
            </Text>
          ))}
        </Card>
        <Card>
          <Text style={typography.body}>{nutritionBasis(result.product.barcode)}</Text>
          <Text style={[typography.label, { color: colors.calorie }]}>
            Calories: {twoDecimals(result.product.calories)} kcal
          </Text>
          <Text style={[typography.label, { color: colors.sodium }]}>
            Sodium: {twoDecimals(result.product.sodium_mg)} mg
          </Text>
          <Text style={typography.body}>Sugar: {twoDecimals(result.product.sugar_g)} g</Text>
          {result.macros?.fat_g != null ? (
            <Text style={typography.body}>Fat: {twoDecimals(result.macros.fat_g)} g</Text>
          ) : null}
          {result.macros?.saturated_fat_g != null ? (
            <Text style={typography.body}>
              Saturated fat: {twoDecimals(result.macros.saturated_fat_g)} g
            </Text>
          ) : null}
          {result.macros?.carbohydrate_g != null ? (
            <Text style={typography.body}>
              Carbohydrate: {twoDecimals(result.macros.carbohydrate_g)} g
            </Text>
          ) : null}
          {result.macros?.fiber_g != null ? (
            <Text style={typography.body}>Fiber: {twoDecimals(result.macros.fiber_g)} g</Text>
          ) : null}
          {result.macros?.protein_g != null ? (
            <Text style={typography.body}>Protein: {twoDecimals(result.macros.protein_g)} g</Text>
          ) : null}
          {result.vitamins?.map((vitamin) => (
            <Text key={vitamin.name} style={typography.body}>
              {vitamin.name}: {twoDecimals(vitamin.amount)} {vitamin.unit}
            </Text>
          ))}
        </Card>
        <DailyLimitNote
          dependentId={dependentId}
          sodiumMg={result.product.sodium_mg}
          sugarG={result.product.sugar_g}
        />
        {eatenSaved ? null : askingEaten ? (
          <Field
            label="How many grams were eaten?"
            value={gramsDraft}
            onChangeText={setGramsDraft}
            keyboardType="decimal-pad"
          />
        ) : null}
        {eatenNote ? <Text style={typography.body}>{eatenNote}</Text> : null}
        {eatenSaved ? null : askingEaten ? (
          <Button label="Confirm" onPress={() => void confirmEaten(result.meal_log_id)} />
        ) : (
          <Button
            label="Eaten"
            onPress={() => {
              setAskingEaten(true);
              setEatenNote(null);
            }}
          />
        )}
        <Button label="Scan again" variant="secondary" onPress={scanAgain} />
      </ScrollView>
    );
  }

  if (phase.kind === "error") {
    return (
      <ScrollView
        contentContainerStyle={screen.tabScroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={typography.section}>{phase.title}</Text>
        <Text style={typography.error}>{phase.message}</Text>
        {phase.canRetry ? (
          <Button label="Retry" onPress={() => void submitLookup(phase.lookup)} />
        ) : null}
        <Button label="Scan again" variant="secondary" onPress={scanAgain} />
        <ManualEntryForm
          barcode={draft}
          dishName={dishDraft}
          onBarcodeChange={setDraft}
          onDishChange={setDishDraft}
          onBarcodeSubmit={() => {
            void submitLookup({ source: "barcode", value: draft.trim() });
          }}
          onDishSubmit={() => {
            void submitLookup({ source: "dish", value: dishDraft.trim() });
          }}
        />
      </ScrollView>
    );
  }

  if (phase.kind === "manual" || !permission.granted) {
    return (
      <ScrollView
        contentContainerStyle={screen.tabScroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {permission.granted ? (
          <Text style={typography.body}>Enter a barcode if the camera cannot read it.</Text>
        ) : (
          <Text style={typography.body}>Camera permission is required to scan. You can enter a barcode instead.</Text>
        )}
        {permission.granted ? (
          <Button label="Use camera" onPress={() => setPhase({ kind: "scan" })} />
        ) : (
          <Button label="Allow camera" onPress={() => void requestPermission()} />
        )}
        <ManualEntryForm
          barcode={draft}
          dishName={dishDraft}
          onBarcodeChange={setDraft}
          onDishChange={setDishDraft}
          onBarcodeSubmit={() => {
            void submitLookup({ source: "barcode", value: draft.trim() });
          }}
          onDishSubmit={() => {
            void submitLookup({ source: "dish", value: dishDraft.trim() });
          }}
        />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
        }}
        onBarcodeScanned={({ data }) => {
          const now = Date.now();
          if (busy.current || now - lastScanAt.current < SCAN_COOLDOWN_MS) {
            return;
          }
          lastScanAt.current = now;
          busy.current = true;
          void submitLookup({ source: "barcode", value: data.trim() });
        }}
      />
      <View style={styles.overlay}>
        <Text style={typography.body}>Point the camera at a barcode.</Text>
        <Button label="Enter barcode manually" onPress={() => setPhase({ kind: "manual" })} />
      </View>
    </View>
  );
}

function limitNote(
  nutrient: IntakeNutrient | undefined,
  addition: number,
  name: string,
  unit: string,
): string | null {
  if (
    !nutrient ||
    nutrient.incomplete ||
    nutrient.consumed == null ||
    nutrient.limit == null ||
    nutrient.exceeded == null
  ) {
    return null;
  }
  if (nutrient.exceeded) {
    return `Today's ${name} is already above the daily target (${nutrient.consumed} ${unit} of ${nutrient.limit} ${unit}). The label above is for 100 g of this food, not today's running total.`;
  }
  if (nutrient.consumed + addition > nutrient.limit) {
    return `Eating 100 g would put today's ${name} above the daily target (${nutrient.consumed} ${unit} so far, plus ${addition} ${unit} in this food). The label above is still the 100 g classification.`;
  }
  return null;
}

function DailyLimitNote({
  dependentId,
  sodiumMg,
  sugarG,
}: {
  dependentId: number;
  sodiumMg: number;
  sugarG: number;
}) {
  const load = useCallback(() => getDailyIntake(dependentId), [dependentId]);
  const intake = useFocusedQuery(load);
  if (intake.status !== "success") {
    return null;
  }
  const notes = [
    limitNote(intake.data.nutrients.sugar, sugarG, "sugar", "g"),
    limitNote(intake.data.nutrients.sodium, sodiumMg, "sodium", "mg"),
  ].filter((note): note is string => note !== null);
  if (notes.length === 0) {
    return null;
  }
  return (
    <Card>
      {notes.map((note) => (
        <Text key={note} style={typography.body}>
          {note}
        </Text>
      ))}
    </Card>
  );
}

function ManualEntryForm({
  barcode,
  dishName,
  onBarcodeChange,
  onDishChange,
  onBarcodeSubmit,
  onDishSubmit,
}: {
  barcode: string;
  dishName: string;
  onBarcodeChange: (value: string) => void;
  onDishChange: (value: string) => void;
  onBarcodeSubmit: () => void;
  onDishSubmit: () => void;
}) {
  return (
    <Card>
      <Field
        label="Barcode"
        value={barcode}
        onChangeText={onBarcodeChange}
        keyboardType="number-pad"
        onSubmitEditing={onBarcodeSubmit}
      />
      <Button label="Look up barcode" onPress={onBarcodeSubmit} />
      <Field label="Dish name" value={dishName} onChangeText={onDishChange} onSubmitEditing={onDishSubmit} />
      <Button label="Look up dish" variant="secondary" onPress={onDishSubmit} />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    padding: 16,
    gap: 8,
    backgroundColor: colors.white,
  },
});
