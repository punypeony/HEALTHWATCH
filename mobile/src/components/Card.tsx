import { StyleSheet, View, type ViewProps } from "react-native";

import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#DCE8E2",
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
