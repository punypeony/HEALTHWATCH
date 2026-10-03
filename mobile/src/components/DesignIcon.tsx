import { Image, type ImageStyle, type StyleProp } from "react-native";

// Static requires let Metro bundle each exported icon for offline use.
const icons = {
  dependent: require("../../assets/design/dependent.png"),
  home: require("../../assets/design/home.png"),
  overview: require("../../assets/design/overview.png"),
  scan: require("../../assets/design/scan.png"),
  intake: require("../../assets/design/intake.png"),
  alerts: require("../../assets/design/alerts.png"),
  safe: require("../../assets/design/safe.png"),
  warning: require("../../assets/design/warning.png"),
  danger: require("../../assets/design/danger.png"),
  camera: require("../../assets/design/camera.png"),
  back: require("../../assets/design/back.png"),
  minus: require("../../assets/design/minus.png"),
};
export type DesignIconName = keyof typeof icons;

export function DesignIcon({ name, size = 24, color, style }: {
  name: DesignIconName; size?: number; color?: string; style?: StyleProp<ImageStyle>;
}) {
  return <Image accessible={false} source={icons[name]} resizeMode="contain"
    style={[{ width: size, height: size }, color ? { tintColor: color } : undefined, style]} />;
}
