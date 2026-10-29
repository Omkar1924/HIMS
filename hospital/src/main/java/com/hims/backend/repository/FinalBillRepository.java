package com.hims.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hims.backend.entity.FinalBill;

public interface FinalBillRepository extends JpaRepository<FinalBill, Long> {
    List<FinalBill> findAllByOrderByIdDesc();
}
