import * as ImageManipulator from 'expo-image-manipulator';

const MAX_WIDTH = 1920;
const COMPRESS = 0.8;

export async function optimizeImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: COMPRESS, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}
