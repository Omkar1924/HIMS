package com.hims.backend.services;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hims.backend.dto.DischargeDtos.SpellChange;
import com.hims.backend.dto.DischargeDtos.SpellResult;

/**
 * Spelling correction through a LanguageTool server (public API or self-hosted).
 * Only clear typos are auto-corrected; anything doubtful is left exactly as typed.
 * If the server is unreachable, the text is returned unchanged so typing is never blocked.
 */
@Service
public class SpellCorrectionService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    private final String url;
    private final String language;
    private final Set<String> ignore = new HashSet<>();

    public SpellCorrectionService(
            @Value("${spellcheck.url:https://api.languagetool.org/v2/check}") String url,
            @Value("${spellcheck.language:en-US}") String language,
            @Value("${spellcheck.ignore:}") String ignoreCsv) {
        this.url = url;
        this.language = language;
        Arrays.stream(ignoreCsv.split(","))
                .map(s -> s.trim().toLowerCase())
                .filter(s -> !s.isEmpty())
                .forEach(ignore::add);
    }

    public SpellResult correct(String text) {
        if (text == null || text.isBlank()) {
            return new SpellResult(text == null ? "" : text, List.of());
        }

        try {
            String body = "language=" + enc(language) + "&text=" + enc(text);
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(5))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return unchanged(text);
            }

            StringBuilder out = new StringBuilder();
            List<SpellChange> changes = new ArrayList<>();
            int last = 0;

            for (JsonNode m : MAPPER.readTree(response.body()).path("matches")) {
                if (!isSpelling(m)) continue;

                int start = m.path("offset").asInt();
                int end = start + m.path("length").asInt();
                if (start < last || end > text.length()) continue;

                String word = text.substring(start, end);
                String fix = m.path("replacements").path(0).path("value").asText("");

                if (!safeToApply(text, start, end, word, fix)) continue;

                out.append(text, last, start).append(fix);
                last = end;
                changes.add(new SpellChange(word, fix, start));
            }
            out.append(text, last, text.length());
            return new SpellResult(out.toString(), changes);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return unchanged(text);
        } catch (Exception e) {
            return unchanged(text);
        }
    }

    // ------------------------------------------------------------ rules

    private boolean isSpelling(JsonNode match) {
        JsonNode rule = match.path("rule");
        return "misspelling".equals(rule.path("issueType").asText())
                || "TYPOS".equals(rule.path("category").path("id").asText());
    }

    /**
     * Auto-correct only obvious typos: a plain lowercase word of 4+ letters,
     * replaced by one lowercase word that starts with the same letter and is at most
     * 2 edits away. This avoids "fixing" drug names, names and abbreviations.
     */
    private boolean safeToApply(String text, int start, int end, String word, String fix) {
        if (word.length() < 4 || !word.matches("[a-z]+")) return false;
        if (!fix.matches("[a-z]+") || fix.charAt(0) != word.charAt(0)) return false;
        if (ignore.contains(word)) return false;
        if (start > 0 && "/@_-0123456789".indexOf(text.charAt(start - 1)) >= 0) return false;
        if (end < text.length() && "/@_-0123456789".indexOf(text.charAt(end)) >= 0) return false;
        return distance(word, fix) <= 2;
    }

    private int distance(String a, String b) {
        int[] prev = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) prev[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            int[] cur = new int[b.length() + 1];
            cur[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                cur[j] = Math.min(Math.min(cur[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            prev = cur;
        }
        return prev[b.length()];
    }

    private SpellResult unchanged(String text) {
        return new SpellResult(text, List.of());
    }

    private String enc(String v) {
        return URLEncoder.encode(v, StandardCharsets.UTF_8);
    }
}