/**
 * Read a file as base64 data URL for storing in DB (e.g. trainers.image, customers.image).
 * Optional max size in bytes; returns null if file too large or read fails.
 */
export function readFileAsBase64(file: File, maxBytes = 2 * 1024 * 1024): Promise<string | null> {
  return new Promise((resolve) => {
    if (file.size > maxBytes) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(typeof result === "string" ? result : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/** Check if a string is a data URL (base64 image) */
export function isDataUrl(s: string | null): boolean {
  return typeof s === "string" && s.startsWith("data:");
}
