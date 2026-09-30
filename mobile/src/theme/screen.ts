import { StyleSheet } from "react-native";

import { colors } from "./colors";
import { spacing } from "./spacing";

export const screen = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.md,
  },
  tabScroll: {
    flexGrow: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.md,
  },
  fill: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
