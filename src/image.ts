import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export type PuzzleImage = { uri: string; width: number; height: number };

const MIN_ASPECT = 0.65;
const MAX_ASPECT = 1.5;
const MAX_SIDE = 1400;

export async function pickImage(): Promise<PuzzleImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return prepareImage(asset.uri, asset.width, asset.height);
}

// Center-crops extreme aspect ratios and downsizes so many pieces stay cheap to render.
async function prepareImage(
  uri: string,
  width: number,
  height: number,
): Promise<PuzzleImage> {
  const aspect = width / height;
  let cropW = width;
  let cropH = height;
  if (aspect < MIN_ASPECT) cropH = Math.round(width / MIN_ASPECT);
  if (aspect > MAX_ASPECT) cropW = Math.round(height * MAX_ASPECT);

  const ctx = ImageManipulator.manipulate(uri);
  if (cropW !== width || cropH !== height) {
    ctx.crop({
      originX: Math.round((width - cropW) / 2),
      originY: Math.round((height - cropH) / 2),
      width: cropW,
      height: cropH,
    });
  }
  if (Math.max(cropW, cropH) > MAX_SIDE) {
    ctx.resize(cropW >= cropH ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const ref = await ctx.renderAsync();
  const saved = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}
