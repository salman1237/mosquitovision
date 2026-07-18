import * as ImageManipulator from 'expo-image-manipulator';

const MAX_DIMENSION = 1024;
const COMPRESS_QUALITY = 0.8;

export async function resizeForUpload(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}
