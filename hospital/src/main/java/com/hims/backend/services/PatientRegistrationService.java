package com.hims.backend.services;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.hims.backend.entity.AddDoctor;
import com.hims.backend.entity.PatientRegistration;
import com.hims.backend.exception.PatientNotFoundException;
import com.hims.backend.repository.AddDoctorRepository;
import com.hims.backend.repository.PatientRegistrationRepository;

@Service
public class PatientRegistrationService {

    private final PatientRegistrationRepository repository;
    private final AddDoctorRepository doctorRepository;

    public PatientRegistrationService(PatientRegistrationRepository repository,
                                      AddDoctorRepository doctorRepository) {
        this.repository = repository;
        this.doctorRepository = doctorRepository;
    }

    private AddDoctor resolveDoctor(AddDoctor incoming) {
        if (incoming == null || incoming.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor is required");
        }
        return doctorRepository.findById(incoming.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor not found"));
    }

    @Transactional
    public PatientRegistration create(PatientRegistration patient) {
        patient.setId(null);
        patient.setUhid(null);
        AddDoctor doctor = resolveDoctor(patient.getDoctor());
        patient.setDoctor(doctor);
        patient.setDoctorDname(doctor.getDoctorName());
        patient.setDoctorSpecialization(doctor.getSpecialization());
        patient.setDoctorFee(doctor.getFee());
        patient.setDoctorQualification(doctor.getDegree());
        patient.setDoctorRegistrationNo(doctor.getRegistrationNo());
        PatientRegistration saved = repository.save(patient);
        saved.setUhid(String.format("UHID%04d", saved.getId()));
        return repository.save(saved);
    }

    public List<PatientRegistration> getAll() {
        return repository.findAllByOrderByIdAsc();
    }

    public PatientRegistration getByUhid(String uhid) {
        return repository.findByUhid(uhid)
                .orElseThrow(() -> new PatientNotFoundException(uhid));
    }

    @Transactional
    public PatientRegistration update(String uhid, PatientRegistration updated) {
        PatientRegistration existing = getByUhid(uhid);
        existing.setFirstName(updated.getFirstName());
        existing.setMiddleName(updated.getMiddleName());
        existing.setLastName(updated.getLastName());
        existing.setContact(updated.getContact());
        existing.setEmailId(updated.getEmailId());
        existing.setAge(updated.getAge());
        existing.setBloodGroup(updated.getBloodGroup());
        existing.setAddress(updated.getAddress());
        existing.setHeight(updated.getHeight());
        existing.setWeight(updated.getWeight());
        AddDoctor doctor = resolveDoctor(updated.getDoctor());
        existing.setDoctor(doctor);
        existing.setDoctorDname(doctor.getDoctorName());
        existing.setDoctorSpecialization(doctor.getSpecialization());
        existing.setDoctorFee(doctor.getFee());
        existing.setDoctorQualification(doctor.getDegree());
        existing.setDoctorRegistrationNo(doctor.getRegistrationNo());
        return repository.save(existing);
    }

    @Transactional
    public void delete(String uhid) {
        repository.delete(getByUhid(uhid));
    }
}
