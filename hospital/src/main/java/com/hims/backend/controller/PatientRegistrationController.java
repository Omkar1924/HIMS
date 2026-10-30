package com.hims.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.hims.backend.entity.PatientRegistration;
import com.hims.backend.services.PatientRegistrationService;

@RestController
@RequestMapping("/api/patient-registrations")
@CrossOrigin(origins = "http://localhost:5173")
public class PatientRegistrationController {

    private final PatientRegistrationService service;

    public PatientRegistrationController(PatientRegistrationService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PatientRegistration create(@RequestBody PatientRegistration patient) {
        return service.create(patient);
    }

    @GetMapping
    public List<PatientRegistration> getAll() {
        return service.getAll();
    }

    @GetMapping("/{uhid}")
    public PatientRegistration getByUhid(@PathVariable("uhid") String uhid) {
        return service.getByUhid(uhid);
    }

    @PutMapping("/{uhid}")
    public PatientRegistration update(@PathVariable("uhid") String uhid,
                                      @RequestBody PatientRegistration patient) {
        return service.update(uhid, patient);
    }

    @DeleteMapping("/{uhid}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("uhid") String uhid) {
        service.delete(uhid);
    }
}
