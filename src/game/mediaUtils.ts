import type { ProofMedia } from "./types";

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 300 * 1024 * 1024;
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

export class MediaError extends Error {}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Turns an uploaded file into proof media.
 *  - photos are downsized to a JPEG data URL, small enough to keep on the device
 *    (and re-encoding drops EXIF/location data as a side effect)
 *  - videos are held as an in-memory blob URL: they play this session but are not stored,
 *    because a video does not fit in browser storage. A backend is what will keep them.
 */
export async function fileToProofMedia(file: File): Promise<ProofMedia> {
  if (file.type.startsWith("video/")) {
    if (file.size > MAX_VIDEO_BYTES) throw new MediaError(`That video is too large. Keep it under ${formatBytes(MAX_VIDEO_BYTES)}.`);
    return { kind: "video", name: file.name, size: file.size, url: URL.createObjectURL(file) };
  }
  if (!file.type.startsWith("image/")) {
    throw new MediaError("That doesn't look like a photo or a video. Try a JPG, PNG, MP4 or MOV.");
  }
  if (file.size > MAX_IMAGE_BYTES) throw new MediaError(`That photo is too large. Keep it under ${formatBytes(MAX_IMAGE_BYTES)}.`);

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const ratio = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new MediaError("Your browser couldn't process that photo.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { kind: "image", name: file.name, size: file.size, url: canvas.toDataURL("image/jpeg", JPEG_QUALITY) };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new MediaError("That photo couldn't be read. Try a different one."));
    img.src = src;
  });
}
