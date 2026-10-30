package com.hims.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hims.backend.entity.AddDoctor;

public interface AddDoctorRepository extends JpaRepository<AddDoctor, Long> {
}
