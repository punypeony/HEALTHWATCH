import { useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSession } from "../auth/SessionContext";
import { colors } from "../theme/colors";
import { radius, spacing } from "../theme/spacing";

/** UI/Header with native safe-area spacing and a profile menu. */
export function AppHeader({ subtitle }: { subtitle?: string }) {
  const insets = useSafeAreaInsets();
  const { caregiverName, logout } = useSession();
  const [open, setOpen] = useState(false);
  const name = caregiverName?.trim() || "Account";

  function close() {
    setOpen(false);
  }

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <Image accessible={false} source={require("../../assets/design/header-background.png")} style={StyleSheet.absoluteFill} resizeMode="stretch" />
      <View style={styles.row}>
        <View style={styles.heading}>
          <View accessibilityRole="header" style={styles.wordmark}>
            <Text style={styles.health}>Health</Text>
            <Text style={styles.watch}>Watch</Text>
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen(true)}
          style={styles.profile}
        >
          <ProfileIcon />
        </Pressable>
      </View>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modal}>
          <Pressable accessibilityLabel="Close profile menu" style={StyleSheet.absoluteFill} onPress={close} />
          <View style={[styles.menu, { top: insets.top + 58, right: spacing.lg }]}>
            <Text style={styles.name}>{name}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log out"
              onPress={() => {
                close();
                void logout();
              }}
              style={styles.logout}
            >
              <Text style={styles.logoutLabel}>Log out</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ProfileIcon() {
  return (
    <View style={styles.icon}>
      <View style={styles.head} />
      <View style={styles.shoulders} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: "transparent", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  heading: { flex: 1, gap: 3 },
  wordmark: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  health: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "#02542D",
  },
  watch: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "#00ACF3",
  },
  subtitle: { fontSize: 13, color: colors.ink },
  profile: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.forest,
  },
  icon: { width: 22, height: 22, alignItems: "center", justifyContent: "flex-end" },
  head: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.forest,
    marginBottom: 2,
  },
  shoulders: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: colors.forest,
  },
  modal: { flex: 1 },
  menu: {
    position: "absolute",
    minWidth: 180,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.tealSoft,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  name: { fontSize: 16, lineHeight: 22, fontWeight: "700", color: colors.ink },
  logout: { minHeight: 44, justifyContent: "center" },
  logoutLabel: { fontSize: 16, lineHeight: 22, fontWeight: "700", color: colors.forest },
});
