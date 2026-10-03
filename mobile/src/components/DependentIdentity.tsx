import { createContext, useContext } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export const DependentIdentityContext = createContext<{ name: string; photoUri?: string } | null>(null);

export function DependentIdentity() {
  const dependent = useContext(DependentIdentityContext);
  if (!dependent) return null;
  return <View style={styles.row}>
    <View style={styles.avatar} accessible={false}>
      {dependent.photoUri ? <Image source={{ uri: dependent.photoUri }} style={styles.photo} /> : <>
        <View style={styles.head} /><View style={styles.shoulders} />
      </>}
    </View>
    <Text style={styles.name}>{dependent.name}</Text>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#D8F1ED", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  photo: { width: 44, height: 44 },
  head: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#43908D", marginBottom: 3 },
  shoulders: { width: 26, height: 14, borderTopLeftRadius: 14, borderTopRightRadius: 14, backgroundColor: "#43908D" },
  name: { flex: 1, fontSize: 19, lineHeight: 25, fontWeight: "700", color: "#135246" },
});
