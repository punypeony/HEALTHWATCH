import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { Button } from "./Button";

type ScreenStatusProps = {
  title: string;
  message: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function ScreenStatus({
  title,
  message,
  loading = false,
  actionLabel,
  onAction,
}: ScreenStatusProps) {
  return (
    <View style={styles.container}>
      <Text style={typography.section}>{title}</Text>
      {loading ? <ActivityIndicator color={colors.teal} /> : null}
      <Text style={typography.body}>{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
