import { ActivityIndicator, View } from "react-native";

import { useSession } from "../auth/SessionContext";
import { colors } from "../theme/colors";
import { screen } from "../theme/screen";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";

export function RootNavigator() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <View style={[screen.fill, { justifyContent: "center" }]}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  if (status === "authenticated") {
    return <AppNavigator />;
  }

  return <AuthNavigator />;
}
