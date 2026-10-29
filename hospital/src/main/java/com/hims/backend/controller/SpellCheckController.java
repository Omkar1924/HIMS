package com.hims.backend.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hims.backend.dto.DischargeDtos.SpellRequest;
import com.hims.backend.dto.DischargeDtos.SpellResult;
import com.hims.backend.services.SpellCorrectionService;

@RestController
@RequestMapping("/api/spellcheck")
@CrossOrigin(origins = "http://localhost:5173")
public class SpellCheckController {

    private final SpellCorrectionService service;

    public SpellCheckController(SpellCorrectionService service) {
        this.service = service;
    }

    /** Body: { "text": "pateint was admited with fevar" } */
    @PostMapping
    public SpellResult correct(@RequestBody SpellRequest in) {
        return service.correct(in.text());
    }
}