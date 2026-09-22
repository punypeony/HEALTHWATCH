import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { HealthCheckScreen } from "../screens/HealthCheckScreen";
import { ScannerScreen } from "../screens/ScannerScreen";
import type { RootStackParamList } from "../types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Health" component={HealthCheckScreen} />
      <Stack.Screen name="Scanner" component={ScannerScreen} />
    </Stack.Navigator>
  );
}
