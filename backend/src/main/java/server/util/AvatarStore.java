package server.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * In-memory store for player photo avatars.
 *
 * A phone uploads its photo once, as a data URL in the select-icon command.
 * The bytes are kept here, and the lobby and every state packet carry only
 * the short id {@code photo:<first 16 hex chars of the SHA-256>}. Phones load
 * the image from {@code GET /avatar/<id>} and cache it, so packets stay a few
 * KB however many players use photos.
 *
 * The store is bounded (the least recently used photo is dropped first) and
 * is never serialized, so photos are gone after a restart. Clients then show
 * the default portrait and the player can pick again.
 */
public final class AvatarStore {
    /** Icon ids for photos start with this. Must match PHOTO_ICON_PREFIX in the frontend constants. */
    public static final String ID_PREFIX = "photo:";

    /**
     * Longest data URL accepted. Jetty closes a websocket that receives a text
     * message over 64 KiB (close code 1009), so uploads must stay well below
     * that. The client aims for 45,000 characters.
     */
    public static final int MAX_DATA_URL_LENGTH = 48_000;

    /** Photos kept at most. Each is roughly 35 KB at the size limit. */
    public static final int MAX_ENTRIES = 200;

    private static final Pattern DATA_URL = Pattern
            .compile("^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$");
    private static final Pattern ID = Pattern.compile("^" + ID_PREFIX + "[0-9a-f]{16}$");

    /** A stored photo: its MIME type and bytes. */
    public static final class Avatar {
        public final String mimeType;
        private final byte[] bytes;

        private Avatar(String mimeType, byte[] bytes) {
            this.mimeType = mimeType;
            this.bytes = bytes;
        }

        public byte[] bytes() {
            return bytes.clone();
        }
    }

    // Access-ordered, so reading a photo keeps it from being evicted.
    private static final Map<String, Avatar> avatars = new LinkedHashMap<>(16, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, Avatar> eldest) {
            return size() > MAX_ENTRIES;
        }
    };

    private AvatarStore() {
    }

    /**
     * Stores a photo sent as a data URL.
     *
     * @param dataUrl a {@code data:image/(jpeg|png|webp);base64,...} URL of at
     *                most {@link #MAX_DATA_URL_LENGTH} characters, whose bytes
     *                really are that image type.
     * @return the photo's icon id, or null if the input is not acceptable.
     *         Identical bytes always give the same id.
     */
    public static synchronized String store(String dataUrl) {
        if (dataUrl == null || dataUrl.length() > MAX_DATA_URL_LENGTH) {
            return null;
        }
        Matcher matcher = DATA_URL.matcher(dataUrl);
        if (!matcher.matches()) {
            return null;
        }
        String type = matcher.group(1);
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(matcher.group(2));
        } catch (IllegalArgumentException e) {
            return null;
        }
        if (!hasMagicBytes(type, bytes)) {
            return null;
        }
        String id = ID_PREFIX + sha256Hex(bytes).substring(0, 16);
        avatars.put(id, new Avatar("image/" + type, bytes));
        return id;
    }

    /** @return true iff {@code id} is shaped like a photo id (whether or not it is stored). */
    public static boolean isPhotoId(String id) {
        return id != null && ID.matcher(id).matches();
    }

    /** @return true iff a photo with this id is stored. */
    public static synchronized boolean has(String id) {
        return get(id) != null;
    }

    /** @return the stored photo, or null if there is none with this id. */
    public static synchronized Avatar get(String id) {
        if (!isPhotoId(id)) {
            return null;
        }
        return avatars.get(id);
    }

    /** @return the number of stored photos. */
    public static synchronized int size() {
        return avatars.size();
    }

    /** Removes every photo. For tests. */
    public static synchronized void clear() {
        avatars.clear();
    }

    private static boolean hasMagicBytes(String type, byte[] b) {
        switch (type) {
            case "jpeg":
                return b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
            case "png":
                return b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                        && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A;
            case "webp":
                return b.length >= 12
                        && new String(b, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
                        && new String(b, 8, 4, StandardCharsets.US_ASCII).equals("WEBP");
            default:
                return false;
        }
    }

    private static String sha256Hex(byte[] bytes) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(bytes);
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte d : digest) {
                hex.append(String.format("%02x", d));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is always available.", e);
        }
    }
}
