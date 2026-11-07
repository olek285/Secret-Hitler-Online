import portraits from "../assets";
import { AVATAR, PHOTO_ICON_PREFIX, SERVER_ADDRESS_HTTP } from "../constants";
import { iconSrc, isPhotoIcon } from "./avatar";

const PHOTO = `${PHOTO_ICON_PREFIX}0123456789abcdef`;

test("photo ids are recognized", () => {
  expect(isPhotoIcon(PHOTO)).toBe(true);
  expect(isPhotoIcon("p7")).toBe(false);
  expect(isPhotoIcon("p_default")).toBe(false);
  expect(isPhotoIcon(undefined)).toBe(false);
  expect(isPhotoIcon(null)).toBe(false);
  expect(isPhotoIcon("")).toBe(false);
});

test("iconSrc picks a portrait, a photo from the server, or the default", () => {
  expect(iconSrc("p7")).toBe(portraits.p7);
  expect(iconSrc(PHOTO)).toBe(`${SERVER_ADDRESS_HTTP}${AVATAR}/${PHOTO}`);
  expect(iconSrc(undefined)).toBe(portraits.p_default);
  expect(iconSrc("no-such-portrait")).toBe(portraits.p_default);
});
