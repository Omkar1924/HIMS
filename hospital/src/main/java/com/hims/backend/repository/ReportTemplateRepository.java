package com.hims.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hims.backend.entity.ReportTemplate;

public interface ReportTemplateRepository extends JpaRepository<ReportTemplate, Long> {
    List<ReportTemplate> findAllByOrderByNameAsc();
    List<ReportTemplate> findByActiveTrueOrderByNameAsc();
    List<ReportTemplate> findByCategoryOrderByNameAsc(String category);
    List<ReportTemplate> findByCategoryAndActiveTrueOrderByNameAsc(String category);
    Optional<ReportTemplate> findByNameIgnoreCase(String name);

    List<ReportTemplate> findByDoctorId(Long doctorId);

    List<ReportTemplate> findByEmployeeId(Long employeeId);
}