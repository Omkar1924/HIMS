package com.hims.backend.services;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.hims.backend.entity.Doctor;
import com.hims.backend.entity.Patient;
import com.hims.backend.exception.PatientNotFoundException;
import com.hims.backend.repository.DoctorRepository;
import com.hims.backend.repository.PatientRepository;

@Service
public class PatientService {

    private final PatientRepository repository;
    private final DoctorRepository doctorRepository;

    public PatientService(PatientRepository repository, DoctorRepository doctorRepository) {
        this.repository = repository;
        this.doctorRepository = doctorRepository;
    }

    private Doctor resolveDoctor(Doctor incoming) {
        if (incoming == null || incoming.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor is required");
        }
        return doctorRepository.findById(incoming.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor not found"));
    }

    @Transactional
    public Patient create(Patient patient) {
        patient.setId(null);
        patient.setUhid(null);
        patient.setDoctor(resolveDoctor(patient.getDoctor()));
        Patient saved = repository.save(patient);
        saved.setUhid(String.format("UHID%04d", saved.getId()));
        return repository.save(saved);
    }

    public List<Patient> getAll() {
        return repository.findAllByOrderByIdAsc();
    }

    public Patient getByUhid(String uhid) {
        return repository.findByUhid(uhid)
                .orElseThrow(() -> new PatientNotFoundException(uhid));
    }

    @Transactional
    public Patient update(String uhid, Patient updated) {
        Patient existing = getByUhid(uhid);
        existing.setFirstName(updated.getFirstName());
        existing.setMiddleName(updated.getMiddleName());
        existing.setLastName(updated.getLastName());
        existing.setContact(updated.getContact());
        existing.setEmail(updated.getEmail());
        existing.setAge(updated.getAge());
        existing.setBloodGroup(updated.getBloodGroup());
        existing.setAddress(updated.getAddress());
        existing.setHeight(updated.getHeight());
        existing.setWeight(updated.getWeight());
        existing.setDoctor(resolveDoctor(updated.getDoctor()));
        return repository.save(existing);
    }

    @Transactional
    public void delete(String uhid) {
        repository.delete(getByUhid(uhid));
    }
}