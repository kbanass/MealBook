export function sameDates(date1: Date, date2: Date): boolean {
  return (
    new Date(
      date1.getFullYear(),
      date1.getMonth(),
      date1.getDate()
    ).getTime() ===
    new Date(date2.getFullYear(), date2.getMonth(), date2.getDate()).getTime()
  );
}

export function getMonthName(date: Date): string {
  const months = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Październik",
    "Listopad",
    "Grudzień",
  ];

  return months[date.getMonth()];
}

export function getLocalISOString(date: Date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, -1);
  return localISOTime; // "2026-01-24T20:30:15.123"
}

export class ImageCompressor {
  private maxSize: number;
  private quality: number;

  constructor(maxSize: number = 1200, quality: number = 0.8) {
    this.maxSize = maxSize;
    this.quality = quality;
  }

  // .HEIC format support
  // If user's browser has native support for .HEIC -> native decode (Safari on IOS)
  // Else -> "heic2any" package dynamic import

  async compress(file: File): Promise<Blob> {
    let source: ImageBitmap;

    //
    try {
      source = await createImageBitmap(file);
    } catch (e) {
      const isHEIC =
        file.name.toLowerCase().endsWith(".heic") || file.type === "image/heic";

      if (isHEIC) {
        console.warn("Native HEIC decoding failed. Loading polyfill...");

        const { default: heic2any } = await import("heic2any");

        const converted = await heic2any({
          blob: file,
          toType: "image/jpeg",
          quality: 0.9,
        });

        const blob = Array.isArray(converted) ? converted[0] : converted;
        source = await createImageBitmap(blob);
      } else {
        throw new Error("Image could not be decoded");
      }
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = this.maxSize;
      canvas.height = this.maxSize;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Can't getContext of canvas");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const scale = Math.max(
        this.maxSize / source.width,
        this.maxSize / source.height
      );
      const scaledWidth = source.width * scale;
      const scaledHeight = source.height * scale;

      const offsetX = (scaledWidth - this.maxSize) / 2;
      const offsetY = (scaledHeight - this.maxSize) / 2;

      ctx.drawImage(source, -offsetX, -offsetY, scaledWidth, scaledHeight);

      return await this.#canvasToBlob(canvas);
    } finally {
      source.close();
    }
  }

  #canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Error when generating Blob"));
        },
        "image/webp",
        this.quality
      );
    });
  }
}

export async function isOpfsSupported(): Promise<boolean> {
  if (!("storage" in navigator) || !("getDirectory" in navigator.storage)) {
    return false;
  }
  try {
    const root = await navigator.storage.getDirectory();
    return !!root;
  } catch (e) {
    return false;
  }
}

export function getElement<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}
