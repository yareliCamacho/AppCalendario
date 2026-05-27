import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';

function uint8ToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const decode =
    typeof globalThis.atob === 'function'
      ? globalThis.atob
      : (input: string) => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
          let str = input.replace(/=+$/, '');
          let output = '';
          for (let i = 0; i < str.length; ) {
            const enc1 = chars.indexOf(str.charAt(i++));
            const enc2 = chars.indexOf(str.charAt(i++));
            const enc3 = chars.indexOf(str.charAt(i++));
            const enc4 = chars.indexOf(str.charAt(i++));
            output += String.fromCharCode((enc1 << 2) | (enc2 >> 4));
            if (enc3 !== 64) output += String.fromCharCode(((enc2 & 15) << 4) | (enc3 >> 2));
            if (enc4 !== 64) output += String.fromCharCode(((enc3 & 3) << 6) | enc4);
          }
          return output;
        };

  const binary = decode(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

/** Lee un archivo local como ArrayBuffer (Supabase Storage en React Native / Expo 54). */
export async function readFileAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (!uri?.trim()) {
    throw new Error('No se pudo leer la imagen (ruta vacía).');
  }

  // API nueva Expo 54
  try {
    const file = new File(uri);
    const bytes = await file.bytes();
    if (bytes.byteLength > 0) {
      return uint8ToArrayBuffer(bytes);
    }
  } catch {
    // sigue con legacy / fetch
  }

  // API legacy (EncodingType vive en /legacy)
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
    if (base64.length > 0) {
      return uint8ToArrayBuffer(base64ToUint8Array(base64));
    }
  } catch {
    // sigue con fetch
  }

  // Último recurso (algunas URIs en Android)
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('No se pudo leer el archivo de la imagen.');
  }
  const blob = await response.blob();
  return blob.arrayBuffer();
}
