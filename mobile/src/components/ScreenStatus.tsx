import { Pressable, StyleSheet, Text, View } from "react-native";

type ScreenStatusProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ScreenStatus({
  title,
  message,
  actionLabel,
  onAction,
}: ScreenStatusProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.button}>
          <Text style={styles.buttonLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
  },
  message: {
    fontSize: 16,
  },
  button: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  buttonLabel: {
    fontSize: 16,
  },
});
