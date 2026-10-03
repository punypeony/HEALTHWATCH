import { Directory, File, Paths } from "expo-file-system";
import type { ImagePickerAsset } from "expo-image-picker";
import { Image } from "react-native";
import type { Dependent } from "../types";

export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

function photoDirectory(dependent: Dependent) {
  return new Directory(Paths.document, "dependent-photos", `${dependent.id}-${encodeURIComponent(dependent.created_at)}`);
}

export function loadProfilePhoto(dependent: Dependent): string | undefined {
  const directory = photoDirectory(dependent);
  if (!directory.exists) return undefined;
  return directory.list().filter((file): file is File => file instanceof File && /^photo-\d+\.jpg$/.test(file.name))
    .sort((a, b) => b.name.localeCompare(a.name))[0]?.uri;
}

export async function saveProfilePhoto(dependent: Dependent, asset: ImagePickerAsset): Promise<string> {
  if ((asset.mimeType && asset.mimeType.toLowerCase() !== "image/jpeg") ||
      (asset.fileName && !/\.jpe?g$/i.test(asset.fileName))) {
    throw new Error("Choose a JPEG image (.jpg or .jpeg). Other formats are not supported.");
  }
  const source = new File(asset.uri);
  const size = source.size;
  if (size > MAX_PROFILE_PHOTO_BYTES) throw new Error("Choose a JPEG photo no larger than 5 MB.");
  if (!source.exists || size <= 0) throw new Error("This photo could not be read. Please choose another JPEG.");
  const bytes = await source.bytes();
  if (bytes.length > MAX_PROFILE_PHOTO_BYTES) throw new Error("Choose a JPEG photo no larger than 5 MB.");
  if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw new Error("This file is not a JPEG image. Choose a .jpg or .jpeg photo.");
  }
  // Ensure the image decodes before replacing a previously saved photo.
  await Image.getSize(asset.uri);
  const directory = photoDirectory(dependent);
  directory.create({ intermediates: true, idempotent: true });
  const previous = directory.list();
  const destination = new File(directory, `photo-${Date.now()}.jpg`);
  try {
    destination.write(bytes);
  } catch (error) {
    if (destination.exists) destination.delete();
    throw error;
  }
  for (const file of previous) {
    if (file instanceof File && /^photo-\d+\.jpg$/.test(file.name) && file.uri !== destination.uri) {
      try { file.delete(); } catch { /* A saved photo remains usable if old-file cleanup fails. */ }
    }
  }
  return destination.uri;
}
