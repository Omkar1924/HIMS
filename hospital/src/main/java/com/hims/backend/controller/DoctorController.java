package com.hims.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.hims.backend.entity.Doctor;
import com.hims.backend.repository.DoctorRepository;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "http://localhost:5173")
public class DoctorController {

    private final DoctorRepository repo;

    public DoctorController(DoctorRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Doctor> getAll() {
        return repo.findAll();
    }

    // optional: lets you add more doctors later (Postman), not needed for now
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Doctor create(@RequestBody Doctor doctor) {
        doctor.setId(null);
        return repo.save(doctor);
    }
}