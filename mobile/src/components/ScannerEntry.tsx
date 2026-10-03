import { StyleSheet, View } from "react-native";
import { Button } from "./Button";
import { Card } from "./Card";
import { Field } from "./Field";

/** Inputs remain controlled by ScannerScreen's existing transaction state. */
export function ScannerEntry({ barcode, dishName, onBarcodeChange, onDishChange, onBarcodeSubmit, onDishSubmit }: {
  barcode: string; dishName: string; onBarcodeChange: (value: string) => void;
  onDishChange: (value: string) => void; onBarcodeSubmit: () => void; onDishSubmit: () => void;
}) {
  return (
    <Card style={styles.card}>
      <Field label="Barcode" placeholder="Number value" value={barcode} onChangeText={onBarcodeChange} keyboardType="number-pad" onSubmitEditing={onBarcodeSubmit} />
      <Button label="Look up barcode" variant="dark" onPress={onBarcodeSubmit} />
      <View style={styles.divider} />
      <Field label="Dish Name" placeholder="Spaghetti or adobo" value={dishName} onChangeText={onDishChange} onSubmitEditing={onDishSubmit} />
      <Button label="Look up dish" variant="secondary" onPress={onDishSubmit} />
    </Card>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 18, gap: 10 },
  divider: { height: 1, backgroundColor: "#8FA5A7", marginVertical: 12 },
});
