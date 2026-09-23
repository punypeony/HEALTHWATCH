import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AlertsScreen } from "../screens/AlertsScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { ScannerScreen } from "../screens/ScannerScreen";
import { SummaryScreen } from "../screens/SummaryScreen";
import type { AppStackParamList, DependentTabParamList } from "../types";

const Tab = createBottomTabNavigator<DependentTabParamList>();

type Props = NativeStackScreenProps<AppStackParamList, "Dependent">;

export function DependentTabs({ route }: Props) {
  const { dependentId } = route.params;

  return (
    <Tab.Navigator key={String(dependentId)} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Scan" component={ScannerScreen} />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        initialParams={{ dependentId }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        initialParams={{ dependentId }}
      />
      <Tab.Screen name="Summary" component={SummaryScreen} />
    </Tab.Navigator>
  );
}
