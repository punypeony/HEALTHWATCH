import { ActivityIndicator, View } from "react-native";

import { useSession } from "../auth/SessionContext";
import { placeholder } from "../theme/placeholder";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";

export function RootNavigator() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <View style={placeholder.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (status === "authenticated") {
    return <AppNavigator />;
  }

  return <AuthNavigator />;
}
