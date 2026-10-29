package com.hims.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hims.backend.entity.DischargeSummary;

public interface DischargeSummaryRepository extends JpaRepository<DischargeSummary, Long> {
    List<DischargeSummary> findAllByOrderByCreatedAtDesc();
}