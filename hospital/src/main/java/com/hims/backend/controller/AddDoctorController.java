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

import com.hims.backend.entity.AddDoctor;
import com.hims.backend.repository.AddDoctorRepository;

@RestController
@RequestMapping("/api/add-doctors")
@CrossOrigin(origins = "http://localhost:5173")
public class AddDoctorController {

    private final AddDoctorRepository repo;

    public AddDoctorController(AddDoctorRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<AddDoctor> getAll() {
        return repo.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddDoctor create(@RequestBody AddDoctor doctor) {
        doctor.setId(null);
        return repo.save(doctor);
    }
}
