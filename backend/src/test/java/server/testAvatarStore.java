package server;

import org.junit.Before;
import org.junit.Test;
import server.util.AvatarStore;
import server.util.Lobby;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;

import static org.junit.Assert.*;

public class testAvatarStore {

    private static final byte[] JPEG = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0x10, 'J', 'F', 'I', 'F' };
    private static final byte[] PNG = { (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0x0D };
    private static final byte[] WEBP = "RIFF\u0000\u0000\u0000\u0000WEBPVP8 ".getBytes(StandardCharsets.ISO_8859_1);

    private static String dataUrl(String type, byte[] bytes) {
        return "data:image/" + type + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    /** A JPEG-looking byte array that differs from others by {@code n}. */
    private static byte[] jpegNumber(int n) {
        byte[] bytes = Arrays.copyOf(JPEG, JPEG.length + 4);
        bytes[JPEG.length] = (byte) (n >> 24);
        bytes[JPEG.length + 1] = (byte) (n >> 16);
        bytes[JPEG.length + 2] = (byte) (n >> 8);
        bytes[JPEG.length + 3] = (byte) n;
        return bytes;
    }

    @Before
    public void setUp() {
        AvatarStore.clear();
    }

    @Test
    public void validPhotoIsStoredAndServed() {
        String id = AvatarStore.store(dataUrl("jpeg", JPEG));
        assertNotNull(id);
        assertTrue(id, id.matches("^photo:[0-9a-f]{16}$"));
        assertTrue(AvatarStore.isPhotoId(id));
        assertTrue(AvatarStore.has(id));
        AvatarStore.Avatar avatar = AvatarStore.get(id);
        assertEquals("image/jpeg", avatar.mimeType);
        assertArrayEquals(JPEG, avatar.bytes());
    }

    @Test
    public void pngAndWebpAreAccepted() {
        String png = AvatarStore.store(dataUrl("png", PNG));
        String webp = AvatarStore.store(dataUrl("webp", WEBP));
        assertNotNull(png);
        assertNotNull(webp);
        assertEquals("image/png", AvatarStore.get(png).mimeType);
        assertEquals("image/webp", AvatarStore.get(webp).mimeType);
    }

    @Test
    public void identicalBytesGiveTheSameId() {
        String first = AvatarStore.store(dataUrl("jpeg", jpegNumber(1)));
        String again = AvatarStore.store(dataUrl("jpeg", jpegNumber(1)));
        String other = AvatarStore.store(dataUrl("jpeg", jpegNumber(2)));
        assertEquals(first, again);
        assertNotEquals(first, other);
        assertEquals(2, AvatarStore.size());
    }

    @Test
    public void oversizeInputIsRejected() {
        byte[] big = Arrays.copyOf(JPEG, 40_000); // about 53,000 base64 chars
        String url = dataUrl("jpeg", big);
        assertTrue(url.length() > AvatarStore.MAX_DATA_URL_LENGTH);
        assertNull(AvatarStore.store(url));

        // Just under the limit is fine.
        byte[] fits = Arrays.copyOf(JPEG, 35_000);
        assertTrue(dataUrl("jpeg", fits).length() <= AvatarStore.MAX_DATA_URL_LENGTH);
        assertNotNull(AvatarStore.store(dataUrl("jpeg", fits)));
    }

    @Test
    public void badBase64IsRejected() {
        assertNull(AvatarStore.store("data:image/jpeg;base64,A")); // incomplete final unit
        assertNull(AvatarStore.store("data:image/jpeg;base64,/9j/@@@@"));
        assertNull(AvatarStore.store("data:image/jpeg;base64,"));
        assertNull(AvatarStore.store("data:image/jpeg,notbase64"));
        assertNull(AvatarStore.store(null));
        assertEquals(0, AvatarStore.size());
    }

    @Test
    public void nonImagesAreRejected() {
        assertNull(AvatarStore.store("data:text/plain;base64," + Base64.getEncoder().encodeToString(JPEG)));
        assertNull(AvatarStore.store(dataUrl("gif", "GIF89a....".getBytes(StandardCharsets.US_ASCII))));
        assertNull(AvatarStore.store(dataUrl("svg+xml", "<svg/>".getBytes(StandardCharsets.US_ASCII))));
        assertNull(AvatarStore.store("p7"));
        assertEquals(0, AvatarStore.size());
    }

    @Test
    public void wrongMagicBytesAreRejected() {
        assertNull(AvatarStore.store(dataUrl("jpeg", PNG)));
        assertNull(AvatarStore.store(dataUrl("png", JPEG)));
        assertNull(AvatarStore.store(dataUrl("webp", JPEG)));
        assertNull(AvatarStore.store(dataUrl("jpeg", "hello world".getBytes(StandardCharsets.US_ASCII))));
        assertNull(AvatarStore.store(dataUrl("jpeg", new byte[] { (byte) 0xFF, (byte) 0xD8 })));
        assertEquals(0, AvatarStore.size());
    }

    @Test
    public void sizeIsBoundedAndOldestPhotoIsDropped() {
        String first = AvatarStore.store(dataUrl("jpeg", jpegNumber(0)));
        String second = AvatarStore.store(dataUrl("jpeg", jpegNumber(1)));
        AvatarStore.get(first); // reading a photo keeps it
        String last = null;
        for (int i = 2; i < AvatarStore.MAX_ENTRIES + 10; i++) {
            last = AvatarStore.store(dataUrl("jpeg", jpegNumber(i)));
            assertTrue(AvatarStore.size() <= AvatarStore.MAX_ENTRIES);
        }
        assertEquals(AvatarStore.MAX_ENTRIES, AvatarStore.size());
        assertTrue(AvatarStore.has(last));
        assertFalse(AvatarStore.has(second));
        assertFalse(AvatarStore.has(first)); // read early, but 200+ newer photos followed
    }

    @Test
    public void unknownOrMalformedIdsAreNotFound() {
        assertFalse(AvatarStore.has("photo:0123456789abcdef"));
        assertNull(AvatarStore.get("photo:0123456789abcdef"));
        assertFalse(AvatarStore.isPhotoId("photo:XYZ"));
        assertFalse(AvatarStore.isPhotoId("photo:0123456789abcdef0"));
        assertNull(AvatarStore.get(null));
    }

    @Test
    public void lobbyStoresOnlyPortraitsAndKnownPhotos() {
        String photo = AvatarStore.store(dataUrl("jpeg", JPEG));
        assertTrue(Lobby.isValidIconId("p7"));
        assertTrue(Lobby.isValidIconId("p_default"));
        assertTrue(Lobby.isValidIconId(photo));
        assertFalse(Lobby.isValidIconId("photo:0123456789abcdef")); // not stored
        assertFalse(Lobby.isValidIconId(dataUrl("jpeg", JPEG))); // raw data never
        assertFalse(Lobby.isValidIconId(""));
        assertFalse(Lobby.isValidIconId(null));
        assertFalse(Lobby.isValidIconId("x".repeat(33)));
    }
}
