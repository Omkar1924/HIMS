package com.hims.backend.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import com.hims.backend.entity.DepositTxn;
import com.hims.backend.entity.DepositType;

public interface DepositTxnRepository extends JpaRepository<DepositTxn, Long> {

    @Query("select coalesce(sum(t.amount), 0) from DepositTxn t where t.patient.id = :pid and t.type = :type")
    BigDecimal sumByType(@Param("pid") Long pid, @Param("type") DepositType type);

    List<DepositTxn> findByPatientIdOrderByIdDesc(Long pid);
}
