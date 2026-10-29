package com.hims.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hims.backend.entity.BillItem;

public interface BillItemRepository extends JpaRepository<BillItem, Long> {
}