import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenStatus } from "../components/ScreenStatus";

const SCAN_COOLDOWN_MS = 1500;

export function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const lastScanAt = useRef(0);

  if (!permission) {
    return <ScreenStatus title="Scanner" message="Checking camera permission..." />;
  }

  if (!permission.granted) {
    return (
      <ScreenStatus
        title="Scanner"
        message="Camera permission is required to scan food barcodes."
        actionLabel="Allow camera"
        onAction={() => {
          void requestPermission();
        }}
      />
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
          if (now - lastScanAt.current < SCAN_COOLDOWN_MS) {
            return;
          }
          lastScanAt.current = now;
          setLastBarcode(data);
        }}
      />
      <View style={styles.overlay}>
        <Text>
          {lastBarcode
            ? `Last barcode: ${lastBarcode}`
            : "Point the camera at a barcode."}
        </Text>
        {lastBarcode ? (
          <Pressable onPress={() => setLastBarcode(null)} style={styles.button}>
            <Text>Clear</Text>
          </Pressable>
        ) : null}
      </View>
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
  button: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
});
