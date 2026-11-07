/**
 * Player photos.
 *
 * The phone shrinks the photo to a small square JPEG and sends it once as a
 * data URL (select-icon). The server stores the bytes and replies with an icon
 * id "photo:<hash>"; packets carry only that id, and every phone loads the
 * image from GET /avatar/<id>, which it may cache forever (the id is a hash
 * of the bytes).
 *
 * Size matters: the server's websocket (Jetty) closes the connection on a text
 * message over 64 KiB, and the server accepts data URLs up to 48,000 chars.
 */
import portraits, { defaultPortrait } from "../assets";
import { AVATAR, PHOTO_ICON_PREFIX, SERVER_ADDRESS_HTTP } from "../constants";

/** Longest data URL we send (the server's limit is 48,000). */
export const MAX_PHOTO_DATA_URL_LENGTH = 45000;

/**
 * Files over this size are refused before decoding. Generous on purpose: a
 * 50-megapixel phone photo can be 20 MB.
 */
export const MAX_PHOTO_FILE_BYTES = 25 * 1024 * 1024;

/** Tried in order until the result is short enough. */
const ENCODINGS = [
  { side: 256, quality: 0.82 },
  { side: 256, quality: 0.7 },
  { side: 192, quality: 0.7 },
];

const JPEG_PREFIX = "data:image/jpeg;base64,";

/** Error messages makeAvatarDataUrl throws; they pick the text to show. */
export const PHOTO_TOO_BIG = "photo-too-big";
export const PHOTO_UNREADABLE = "photo-unreadable";

/** @return true iff the icon id is an uploaded photo ("photo:<hash>"). */
export function isPhotoIcon(id?: string | null): boolean {
  return !!id && id.startsWith(PHOTO_ICON_PREFIX);
}

/** @return the image URL for an icon id: a portrait, a photo, or the default portrait. */
export function iconSrc(id?: string | null): string {
  if (id && portraits[id]) {
    return portraits[id];
  }
  if (isPhotoIcon(id)) {
    return `${SERVER_ADDRESS_HTTP}${AVATAR}/${id}`;
  }
  return portraits[defaultPortrait];
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(PHOTO_UNREADABLE));
    };
    image.src = url;
  });
}

/**
 * Turns a picked file into a square JPEG data URL of at most
 * MAX_PHOTO_DATA_URL_LENGTH characters: center-cropped, 256px at quality
 * 0.82, stepping down to quality 0.7 and then 192px if needed.
 *
 * @throws Error with message PHOTO_TOO_BIG for huge files, else PHOTO_UNREADABLE
 */
export async function makeAvatarDataUrl(file: File): Promise<string> {
  // Some Android pickers leave the type empty, so only a known non-image is refused.
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error(PHOTO_UNREADABLE);
  }
  if (file.size > MAX_PHOTO_FILE_BYTES) {
    throw new Error(PHOTO_TOO_BIG);
  }
  const image = await loadImage(file);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const crop = Math.min(width, height);
  if (!crop) {
    throw new Error(PHOTO_UNREADABLE);
  }
  for (const { side, quality } of ENCODINGS) {
    const canvas = document.createElement("canvas");
    canvas.width = side;
    canvas.height = side;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(PHOTO_UNREADABLE);
    }
    context.imageSmoothingQuality = "high";
    context.drawImage(
      image,
      (width - crop) / 2,
      (height - crop) / 2,
      crop,
      crop,
      0,
      0,
      side,
      side
    );
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (
      dataUrl.startsWith(JPEG_PREFIX) &&
      dataUrl.length <= MAX_PHOTO_DATA_URL_LENGTH
    ) {
      return dataUrl;
    }
  }
  throw new Error(PHOTO_UNREADABLE);
}
