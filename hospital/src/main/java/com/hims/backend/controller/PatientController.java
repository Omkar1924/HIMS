package com.hims.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.hims.backend.entity.Patient;
import com.hims.backend.services.PatientService;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "http://localhost:5173")
public class PatientController {

    private final PatientService service;

    public PatientController(PatientService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Patient> create(@RequestBody Patient patient) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(patient));
    }

    @GetMapping
    public List<Patient> getAll() {
        return service.getAll();
    }

    @GetMapping("/{uhid}")
    public Patient getById(@PathVariable("uhid") String uhid) {
        return service.getByUhid(uhid);
    }

    @PutMapping("/{uhid}")
    public Patient update(@PathVariable("uhid") String uhid, @RequestBody Patient patient) {
        return service.update(uhid, patient);
    }

    @DeleteMapping("/{uhid}")
    public ResponseEntity<Void> delete(@PathVariable("uhid") String uhid) {
        service.delete(uhid);
        return ResponseEntity.noContent().build();
    }
}