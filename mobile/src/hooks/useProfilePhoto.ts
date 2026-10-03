import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { Dependent } from "../types";
import { loadProfilePhoto, saveProfilePhoto } from "../utils/profilePhoto";

export function useProfilePhoto(dependent: Dependent) {
  const [imageUri, setImageUri] = useState<string>();
  const [busy, setBusy] = useState(false);
  const picking = useRef(false);
  useEffect(() => {
    try { setImageUri(loadProfilePhoto(dependent)); }
    catch { setImageUri(undefined); }
  }, [dependent.id, dependent.created_at]);

  async function choosePhoto() {
    if (picking.current) return;
    picking.current = true;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: false, allowsMultipleSelection: false,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(await saveProfilePhoto(dependent, result.assets[0]));
      }
    } catch (error) {
      Alert.alert("Unable to save photo", error instanceof Error ? error.message : "Please try another JPEG photo up to 5 MB.");
    } finally {
      picking.current = false;
      setBusy(false);
    }
  }
  return { imageUri, busy, choosePhoto };
}
