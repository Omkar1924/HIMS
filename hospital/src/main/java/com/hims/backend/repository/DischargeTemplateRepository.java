package com.hims.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hims.backend.entity.DischargeTemplate;

public interface DischargeTemplateRepository extends JpaRepository<DischargeTemplate, Long> {
    List<DischargeTemplate> findAllByOrderByNameAsc();
    List<DischargeTemplate> findByActiveTrueOrderByNameAsc();
    Optional<DischargeTemplate> findByNameIgnoreCase(String name);
}