package com.hims.backend.util;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Codec for report content ({@code contentJson}).
 *
 * Report content is stored in plain text in the database but is encoded before
 * it is written to any network response, so the filled report data is not
 * readable as plain text in browser dev tools / network traces. The frontend
 * decodes it on receipt so the report auto-fills, and re-encodes before sending
 * it back.
 *
 * This is encoding (obfuscation on the wire), not encryption.
 */
public final class ReportContentCodec {

    private static final Base64.Encoder ENCODER = Base64.getEncoder();
    private static final Base64.Decoder DECODER = Base64.getDecoder();

    private ReportContentCodec() {
    }

    /**
     * Encode plain text for transport. Returns {@code null} for a {@code null} input.
     */
    public static String encode(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        return ENCODER.encodeToString(plaintext.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Decode transport-encoded text back to plain text.
     *
     * Values that are not valid Base64 (for example legacy plain text already in
     * the database) are returned unchanged so existing reports keep working.
     */
    public static String decode(String encoded) {
        if (encoded == null) {
            return null;
        }
        try {
            byte[] bytes = DECODER.decode(encoded);
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return encoded;
        }
    }
}
