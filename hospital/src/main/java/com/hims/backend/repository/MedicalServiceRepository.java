package com.hims.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hims.backend.entity.MedicalService;

public interface MedicalServiceRepository extends JpaRepository<MedicalService, Long> {
    List<MedicalService> findAllByOrderByCategoryAscNameAsc();
}
