import { useContext, useState } from "react";
import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import { WallpaperHeightContext } from "./Screen";
import { wallpaperColor } from "../theme/wallpaper";

// Continuous alpha masks avoid fractional-layout seams between View strips.
// Their combined opacity follows the fade while blending the wallpaper's
// color at the top of this overlay into its bottom endpoint.
export function BottomFade() {
  const rootHeight = useContext(WallpaperHeightContext);
  const window = useWindowDimensions();
  const [height, setHeight] = useState(0);
  const wallpaperHeight = rootHeight || window.height;
  return <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}
    onLayout={event => setHeight(event.nativeEvent.layout.height)}>
    <Image accessible={false} source={require("../../assets/design/bottom-fade-top-mask.png")}
      resizeMode="stretch" style={[StyleSheet.absoluteFill, { width: "100%", height: "100%", tintColor: wallpaperColor(1 - height / wallpaperHeight) }]} />
    <Image accessible={false} source={require("../../assets/design/bottom-fade-bottom-mask.png")}
      resizeMode="stretch" style={[StyleSheet.absoluteFill, { width: "100%", height: "100%", tintColor: wallpaperColor(1) }]} />
  </View>;
}
