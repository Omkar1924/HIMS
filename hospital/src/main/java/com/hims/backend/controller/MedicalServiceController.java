package com.hims.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.hims.backend.entity.MedicalService;
import com.hims.backend.repository.MedicalServiceRepository;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "http://localhost:5173")
public class MedicalServiceController {

    private final MedicalServiceRepository repo;

    public MedicalServiceController(MedicalServiceRepository repo) { this.repo = repo; }

    @GetMapping
    public List<MedicalService> getAll() {
        return repo.findAllByOrderByCategoryAscNameAsc();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MedicalService create(@RequestBody MedicalService s) {
        s.setId(null);
        return repo.save(s);
    }
}