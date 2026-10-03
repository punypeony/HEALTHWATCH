import { createContext, useContext } from "react";
import { HeaderHeightContext } from "@react-navigation/elements";

// Measured custom navigation height, including its raised scan control.
export const BottomOverlayContext = createContext(0);
export function useOverlayInsets() {
  return {
    top: useContext(HeaderHeightContext) ?? 0,
    bottom: useContext(BottomOverlayContext),
  };
}
