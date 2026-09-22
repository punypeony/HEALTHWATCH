import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenStatus } from "../components/ScreenStatus";
import { useHealthCheck } from "../hooks/useHealthCheck";
import type { RootStackParamList } from "../types";
import { getApiBaseUrl } from "../utils/apiBaseUrl";

export function HealthCheckScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const health = useHealthCheck();

  if (health.status === "loading") {
    return <ScreenStatus title="Backend health" message="Checking /health..." />;
  }

  if (health.status === "error") {
    return (
      <ScreenStatus
        title="Backend health"
        message={health.message}
        actionLabel="Retry"
        onAction={health.retry}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend health</Text>
      <Text>API: {getApiBaseUrl()}</Text>
      <Text>status: {health.data.status}</Text>
      <Pressable onPress={health.retry} style={styles.button}>
        <Text>Check again</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Scanner")} style={styles.button}>
        <Text>Open scanner</Text>
      </Pressable>
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
  button: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
});
