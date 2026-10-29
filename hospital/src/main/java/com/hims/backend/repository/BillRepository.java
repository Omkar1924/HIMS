package com.hims.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hims.backend.entity.Bill;
import com.hims.backend.entity.BillStatus;

public interface BillRepository extends JpaRepository<Bill, Long> {

    Optional<Bill> findByBillNo(String billNo);

    List<Bill> findByPatientIdAndFinalBillIsNullOrderByIdAsc(Long patientId);

    @Query("""
        select b from Bill b
        where lower(b.billNo) like lower(concat('%', :q, '%'))
           or lower(b.patient.uhid) like lower(concat('%', :q, '%'))
           or lower(b.patient.firstName) like lower(concat('%', :q, '%'))
           or lower(b.patient.lastName) like lower(concat('%', :q, '%'))
        order by b.id desc
        """)
    List<Bill> search(@Param("q") String q);

    @Query("""
        select b from Bill b
        where b.status = :status and (
              lower(b.billNo) like lower(concat('%', :q, '%'))
           or lower(b.patient.uhid) like lower(concat('%', :q, '%'))
           or lower(b.patient.firstName) like lower(concat('%', :q, '%'))
           or lower(b.patient.lastName) like lower(concat('%', :q, '%')))
        order by b.id desc
        """)
    List<Bill> searchByStatus(@Param("status") BillStatus status, @Param("q") String q);
}
