import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { getDependent } from "../api";
import { loadProfilePhoto } from "../utils/profilePhoto";
import { readQuery } from "../utils/queryCache";
import { DependentIdentityContext } from "../components/DependentIdentity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomOverlayContext } from "../components/OverlayInsets";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AlertsScreen } from "../screens/AlertsScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { IntakeScreen } from "../screens/IntakeScreen";
import { ScannerScreen } from "../screens/ScannerScreen";
import { SummaryScreen } from "../screens/SummaryScreen";
import { colors } from "../theme/colors";
import { HealthTabBar } from "./HealthTabBar";
import type { AppStackParamList, DependentTabParamList, Dependent } from "../types";

const Tab = createBottomTabNavigator<DependentTabParamList>();

type Props = NativeStackScreenProps<AppStackParamList, "Dependent">;

export function DependentTabs({ route }: Props) {
  const { dependentId } = route.params;
  const insets = useSafeAreaInsets();
  const [barHeight, setBarHeight] = useState(110 + Math.max(insets.bottom, 16));
  const cachedIdentity = useCallback(() => {
    const dependent = readQuery<Dependent[]>("dependents").data?.find(item => item.id === dependentId);
    let photoUri: string | undefined;
    try { if (dependent) photoUri = loadProfilePhoto(dependent); } catch { /* Keep silhouette. */ }
    return { name: dependent?.name ?? route.params.dependentName, photoUri };
  }, [dependentId, route.params.dependentName]);
  const [identity, setIdentity] = useState(cachedIdentity);
  useFocusEffect(useCallback(() => {
    let active = true;
    setIdentity(cachedIdentity());
    void getDependent(dependentId).then(dependent => {
      let photoUri: string | undefined;
      try { photoUri = loadProfilePhoto(dependent); } catch { /* Use silhouette if local storage is unavailable. */ }
      if (active) setIdentity({ name: dependent.name, photoUri });
    }).catch(() => { /* Keep the known route name; each tab handles its own API errors. */ });
    return () => { active = false; };
  }, [dependentId, cachedIdentity]));

  return (
    <DependentIdentityContext.Provider value={identity}>
    <BottomOverlayContext.Provider value={barHeight}>
    <Tab.Navigator
      initialRouteName="Summary"
      tabBar={(props) => <HealthTabBar {...props} onHeightChange={setBarHeight} />}
      key={String(dependentId)}
      screenOptions={{
        animation: "none",
        headerShown: false,
        sceneStyle: { backgroundColor: "transparent" },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen name="Scan" component={ScannerScreen} initialParams={{ dependentId }} />
      <Tab.Screen name="History" component={HistoryScreen} initialParams={{ dependentId }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} initialParams={{ dependentId }} />
      <Tab.Screen name="Summary" component={SummaryScreen} initialParams={{ dependentId }} />
      <Tab.Screen name="Intake" component={IntakeScreen} initialParams={{ dependentId }} />
    </Tab.Navigator>
    </BottomOverlayContext.Provider>
    </DependentIdentityContext.Provider>
  );
}
