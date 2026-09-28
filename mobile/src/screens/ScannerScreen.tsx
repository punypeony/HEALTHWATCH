import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, markMealEaten, scanDependent } from "../api";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Field } from "../components/Field";
import { RiskBadge } from "../components/RiskBadge";
import { ScreenStatus } from "../components/ScreenStatus";
import { colors } from "../theme/colors";
import { screen } from "../theme/screen";
import { typography } from "../theme/typography";
import type { DependentTabParamList, ScanResult } from "../types";
import { errorMessage } from "../utils/errors";

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
  return {
    kind: "error",
    lookup,
    title: "Scan failed",
    message: errorMessage(error),
    canRetry: true,
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
      <ScrollView contentContainerStyle={screen.tabScroll} keyboardShouldPersistTaps="handled">
        <RiskBadge label={result.risk_label} />
        <Text style={typography.section}>{result.product.name}</Text>
        <Card>
          <Text style={typography.label}>Why?</Text>
          {result.reasons.map((reason, index) => (
            <Text key={`${result.meal_log_id}-${index}`} style={typography.body}>
              • {reason}
            </Text>
          ))}
        </Card>
        <Card>
          <Text style={[typography.label, { color: colors.calorie }]}>
            Calories: {result.product.calories}
          </Text>
          <Text style={[typography.label, { color: colors.sodium }]}>
            Sodium: {result.product.sodium_mg} mg
          </Text>
          <Text style={[typography.label, { color: colors.sugar }]}>Sugar: {result.product.sugar_g} g</Text>
          {result.saturated_fat_g != null ? (
            <Text style={[typography.label, { color: colors.saturatedFat }]}>
              Saturated fat: {result.saturated_fat_g} g
            </Text>
          ) : null}
          {result.carbohydrate_g != null ? (
            <Text style={[typography.label, { color: colors.teal }]}>
              Carbohydrate: {result.carbohydrate_g} g
            </Text>
          ) : null}
          {result.protein_g != null ? (
            <Text style={[typography.label, { color: colors.forest }]}>Protein: {result.protein_g} g</Text>
          ) : null}
        </Card>
        {askingEaten ? (
          <Field
            label="How many grams were eaten?"
            value={gramsDraft}
            onChangeText={setGramsDraft}
            keyboardType="decimal-pad"
          />
        ) : null}
        {eatenNote ? <Text style={typography.body}>{eatenNote}</Text> : null}
        {askingEaten ? (
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
      <ScrollView contentContainerStyle={screen.tabScroll} keyboardShouldPersistTaps="handled">
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
      <ScrollView contentContainerStyle={screen.tabScroll} keyboardShouldPersistTaps="handled">
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
    paddingBottom: 120,
    gap: 8,
    backgroundColor: colors.white,
  },
});
