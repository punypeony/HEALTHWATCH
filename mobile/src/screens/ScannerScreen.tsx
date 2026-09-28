import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiError, markMealEaten, scanDependent } from "../api";
import { Field } from "../components/Field";
import { ScreenStatus } from "../components/ScreenStatus";
import { placeholder } from "../theme/placeholder";
import type { DependentTabParamList, RiskLabel, ScanResult } from "../types";
import { errorMessage } from "../utils/errors";

const SCAN_COOLDOWN_MS = 1500;

const RISK_COLOR: Record<RiskLabel, string> = {
  safe: "#1b7f3a",
  warning: "#c48a00",
  danger: "#b00020",
};

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
      <ScrollView contentContainerStyle={placeholder.screen} keyboardShouldPersistTaps="handled">
        <Text style={[styles.risk, { color: RISK_COLOR[result.risk_label] }]}>
          {result.risk_label.toUpperCase()}
        </Text>
        <Text style={placeholder.title}>{result.product.name}</Text>
        <Text>Calories: {result.product.calories}</Text>
        <Text>Sodium: {result.product.sodium_mg} mg</Text>
        <Text>Sugar: {result.product.sugar_g} g</Text>
        {result.saturated_fat_g != null ? <Text>Saturated fat: {result.saturated_fat_g} g</Text> : null}
        {result.carbohydrate_g != null ? <Text>Carbohydrate: {result.carbohydrate_g} g</Text> : null}
        {result.protein_g != null ? <Text>Protein: {result.protein_g} g</Text> : null}
        {result.reasons.map((reason, index) => (
          <Text key={`${result.meal_log_id}-${index}`}>{reason}</Text>
        ))}
        {askingEaten ? (
          <Field
            label="How many grams were eaten?"
            value={gramsDraft}
            onChangeText={setGramsDraft}
            keyboardType="decimal-pad"
          />
        ) : null}
        {eatenNote ? <Text>{eatenNote}</Text> : null}
        {askingEaten ? (
          <Pressable
            onPress={() => {
              void confirmEaten(result.meal_log_id);
            }}
            style={placeholder.button}
          >
            <Text>Confirm</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              setAskingEaten(true);
              setEatenNote(null);
            }}
            style={placeholder.button}
          >
            <Text>Eaten</Text>
          </Pressable>
        )}
        <Pressable onPress={scanAgain} style={placeholder.button}>
          <Text>Scan again</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase.kind === "error") {
    return (
      <ScrollView contentContainerStyle={placeholder.screen} keyboardShouldPersistTaps="handled">
        <Text style={placeholder.title}>{phase.title}</Text>
        <Text style={placeholder.error}>{phase.message}</Text>
        {phase.canRetry ? (
          <Pressable
            onPress={() => {
              void submitLookup(phase.lookup);
            }}
            style={placeholder.button}
          >
            <Text>Retry</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={scanAgain} style={placeholder.button}>
          <Text>Scan again</Text>
        </Pressable>
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
      <ScrollView contentContainerStyle={placeholder.screen} keyboardShouldPersistTaps="handled">
        <Text style={placeholder.title}>Scan</Text>
        {permission.granted ? (
          <Text>Enter a barcode if the camera cannot read it.</Text>
        ) : (
          <Text>Camera permission is required to scan. You can enter a barcode instead.</Text>
        )}
        {permission.granted ? (
          <Pressable onPress={() => setPhase({ kind: "scan" })} style={placeholder.button}>
            <Text>Use camera</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              void requestPermission();
            }}
            style={placeholder.button}
          >
            <Text>Allow camera</Text>
          </Pressable>
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
        <Text>Point the camera at a barcode.</Text>
        <Pressable onPress={() => setPhase({ kind: "manual" })} style={placeholder.button}>
          <Text>Enter barcode manually</Text>
        </Pressable>
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
    <View style={placeholder.field}>
      <Field
        label="Barcode"
        value={barcode}
        onChangeText={onBarcodeChange}
        keyboardType="number-pad"
        onSubmitEditing={onBarcodeSubmit}
      />
      <Pressable onPress={onBarcodeSubmit} style={placeholder.button}>
        <Text>Look up barcode</Text>
      </Pressable>
      <Field
        label="Dish name"
        value={dishName}
        onChangeText={onDishChange}
        onSubmitEditing={onDishSubmit}
      />
      <Pressable onPress={onDishSubmit} style={placeholder.button}>
        <Text>Look up dish</Text>
      </Pressable>
    </View>
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
    gap: 12,
  },
  risk: {
    fontSize: 22,
  },
});
