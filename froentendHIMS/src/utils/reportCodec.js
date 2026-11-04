/**
 * Codec for report content ({@code contentJson}).
 *
 * The backend stores report content in plain text but encodes it before writing
 * it to any network response, so the filled report data is not readable as
 * plain text in browser dev tools / network traces. This module decodes it on
 * receipt so the report auto-fills, and re-encodes before sending it back.
 *
 * This is encoding (obfuscation on the wire), not encryption.
 */

export const encodeContent = (text) => {
  if (text == null) return "";
  try {
    return btoa(unescape(encodeURIComponent(String(text))));
  } catch {
    return String(text);
  }
};

export const decodeContent = (encoded) => {
  if (encoded == null || encoded === "") return "";
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return String(encoded);
  }
};
