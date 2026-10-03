import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

export function ProfileAvatar({ name, imageUri, onPress, busy = false, size = 62 }: { name: string; imageUri?: string; onPress?: () => void; busy?: boolean; size?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${imageUri ? "Change" : "Add"} profile photo for ${name}`}
      accessibilityHint="Choose a JPEG photo up to 5 MB" accessibilityState={{ busy, disabled: busy }}
      disabled={!onPress || busy} onPress={onPress} style={({ pressed }) => [styles.avatar, { width: size, height: size, borderRadius: size / 2 }, pressed && { opacity: 0.7 }]}>
      {imageUri ? <Image source={{ uri: imageUri }} style={[styles.photo, { width: size - 2, height: size - 2, borderRadius: (size - 2) / 2 }]} /> : <View accessible={false} style={[styles.person, { transform: [{ scale: size / 62 }] }]}>
        <View style={styles.head} /><View style={styles.shoulders} />
      </View>}
      {onPress ? <View pointerEvents="none" style={styles.add}><Text style={styles.plus}>+</Text></View> : null}
      {busy ? <ActivityIndicator style={StyleSheet.absoluteFill} color="#135246" /> : null}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#D8F1ED", borderWidth: 1, borderColor: "#4EAAA5", alignItems: "center", justifyContent: "center" },
  photo: { width: 60, height: 60, borderRadius: 30 },
  person: { width: 42, height: 44, alignItems: "center", justifyContent: "flex-end", overflow: "hidden", borderRadius: 16 },
  head: { width: 17, height: 17, borderRadius: 9, backgroundColor: "#43908D", marginBottom: 4 },
  shoulders: { width: 37, height: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#43908D" },
  add: { position: "absolute", right: -2, bottom: -1, width: 22, height: 22, borderRadius: 11, backgroundColor: "#135246", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FFFFFF" },
  plus: { color: "#FFFFFF", fontSize: 17, lineHeight: 20 },
});
