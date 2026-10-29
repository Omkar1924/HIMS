package com.hims.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hims.backend.entity.Doctor;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
}