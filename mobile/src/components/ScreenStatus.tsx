import { ActivityIndicator, StyleSheet, Text } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { Button } from "./Button";
import { Screen } from "./Screen";
import { Card } from "./Card";

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
    <Screen contentContainerStyle={styles.container}><Card>
      <Text style={typography.section}>{title}</Text>
      {loading ? <ActivityIndicator color={colors.teal} /> : null}
      <Text style={typography.body}>{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </Card></Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "transparent",
    padding: spacing.lg,
    gap: spacing.md,
  },
});
