package com.hims.backend.services;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Places the nurse's answers into the template's sentence frames.
 * It never invents content: blank answers become a "not documented" marker.
 */
@Component
public class NarrativeRenderer {

    public static final String NOT_DOCUMENTED = "[Not documented \u2013 to be completed by doctor]";
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public String render(String sectionsJson) {
        try {
            JsonNode root = MAPPER.readTree(sectionsJson == null ? "[]" : sectionsJson);
            ArrayNode out = MAPPER.createArrayNode();

            for (JsonNode section : root) {
                List<String> parts = new ArrayList<>();
                for (JsonNode field : section.path("fields")) {
                    String text = renderField(field);
                    if (!text.isBlank()) {
                        parts.add(text);
                    }
                }
                ObjectNode o = out.addObject();
                o.put("id", section.path("id").asText());
                o.put("heading", section.path("heading").asText());
                o.put("layout", section.path("layout").asText("normal"));
                o.put("text", String.join("\n", parts));
            }
            return MAPPER.writeValueAsString(out);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sections JSON is invalid");
        }
    }

    private String renderField(JsonNode f) {
        String type = f.path("inputType").asText("TEXT");
        String value = f.path("value").asText("").trim();
        JsonNode yes = f.path("yes");

        if ("YES_NO_TEXT".equals(type)) {
            if (yes.isMissingNode() || yes.isNull()) {
                return NOT_DOCUMENTED;
            }
            if (!yes.asBoolean()) {
                return f.path("narrativeNo").asText("").trim();
            }
        }

        if (value.isEmpty()) {
            return NOT_DOCUMENTED;
        }
        return apply(f.path("narrative").asText(""), value);
    }

    private String apply(String frame, String value) {
        if (frame == null || frame.isBlank()) {
            return value;
        }
        String cleaned = value.replaceAll("[.\\s]+$", "");
        return frame.replace("{{answer}}", cleaned);
    }
}