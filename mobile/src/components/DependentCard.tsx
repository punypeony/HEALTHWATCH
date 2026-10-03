import { StyleSheet, Text, View } from "react-native";
import type { Dependent } from "../types";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { Button } from "./Button";
import { Card } from "./Card";
import { NutritionTile } from "./NutritionTile";
import { ProfileAvatar } from "./ProfileAvatar";
import { useProfilePhoto } from "../hooks/useProfilePhoto";

const CARD_PADDING = 14;
const PROFILE_WIDTH = 82;

/** Native counterpart of UI/Components/Dependent; values come from the API. */
export function DependentCard({ dependent, onOpen, onEdit }: {
  dependent: Dependent; onOpen: () => void; onEdit: () => void;
}) {
  const profile = dependent.dietary_profile;
  const photo = useProfilePhoto(dependent);
  const showFourTargets = profile.allergies.length > 0 || profile.conditions.length > 0;
  return (
    <View>
      <View style={styles.nameTab}><Text style={styles.name}>{dependent.name}</Text></View>
      <Card style={styles.card}>
        <View style={showFourTargets ? styles.sideBySide : styles.stacked}>
        <View style={showFourTargets ? styles.profileColumn : styles.details}>
          <ProfileAvatar name={dependent.name} size={PROFILE_WIDTH} imageUri={photo.imageUri} busy={photo.busy} onPress={photo.choosePhoto} />
          <View style={[styles.demographics, showFourTargets && { flex: 0, width: "100%" }]}>
            <Text style={typography.body}>{dependent.age} Years Old</Text>
            <Text style={typography.body}>{dependent.sex === "male" ? "Male" : "Female"}</Text>
          </View>
        </View>
        <View style={[styles.details, showFourTargets && styles.gridColumn]}>
          <View style={styles.targets} accessibilityLabel="Daily nutrition targets">
          <View style={styles.nutrients}>
            <NutritionTile compact label="Sodium" value={`${profile.daily_sodium_mg} mg`} tone="sodium" />
            <NutritionTile compact label="Calorie" value={`${profile.daily_calories} kcal`} tone="calorie" />
            {!showFourTargets ? <NutritionTile compact label="Sugar" value={`${profile.daily_sugar_g} g`} tone="sugar" /> : null}
          </View>
          {showFourTargets ? <View style={styles.nutrients}>
            <NutritionTile compact label="Sugar" value={`${profile.daily_sugar_g} g`} tone="sugar" />
            <NutritionTile compact label="Saturated Fat" value={profile.daily_calories > 0 ? `${(0.1 * profile.daily_calories / 9).toFixed(1)} g` : "Unavailable"} tone="saturatedFat" />
          </View> : null}
          </View>
        </View>
        </View>
        {profile.conditions.length > 0 ? <View style={styles.chips}>
          {profile.conditions.map(condition => <Text key={condition} style={styles.chip}>{condition}</Text>)}
        </View> : null}
        <View style={styles.actions}>
          <View style={styles.action}><Button label="Open" onPress={onOpen} /></View>
          <View style={styles.action}><Button label="Edit" variant="outline" onPress={onEdit} /></View>
        </View>
      </Card>
    </View>
  );
}
const styles = StyleSheet.create({
  nameTab: { alignSelf: "flex-start", backgroundColor: "#5CAEAA", padding: 9, borderTopLeftRadius: 12, borderTopRightRadius: 12, maxWidth: "100%" },
  name: { ...typography.label, color: colors.white, fontWeight: "600" },
  card: { borderTopLeftRadius: 0, borderRadius: 12, padding: CARD_PADDING, gap: 10 },
  details: { flexDirection: "row", alignItems: "center", gap: 8 },
  stacked: { gap: 10 },
  sideBySide: { flexDirection: "row", alignItems: "center", gap: CARD_PADDING },
  profileColumn: { width: PROFILE_WIDTH, flexShrink: 0, gap: 8, alignItems: "flex-start" },
  gridColumn: { flex: 1, minWidth: 0 },
  demographics: { flex: 1, gap: 2 },
  targets: { flex: 1, minWidth: 0, gap: 6 },
  nutrients: { flexDirection: "row", gap: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  chip: { fontSize: 12, lineHeight: 17, color: "#397E7B", backgroundColor: "#E3F2F1", borderColor: "#14AE5C", borderWidth: 1, borderRadius: 24, padding: 5 },
  actions: { flexDirection: "row", gap: 6 },
  action: { flex: 1 },
});
