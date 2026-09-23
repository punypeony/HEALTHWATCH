import { StyleSheet } from "react-native";

export const placeholder = StyleSheet.create({
  screen: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
  },
  card: {
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  field: {
    gap: 4,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 16,
  },
  button: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  error: {
    color: "#8b0000",
  },
  tag: {
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});
