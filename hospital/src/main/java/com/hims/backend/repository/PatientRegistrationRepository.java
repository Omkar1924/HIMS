package com.hims.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hims.backend.entity.PatientRegistration;

public interface PatientRegistrationRepository extends JpaRepository<PatientRegistration, Long> {
    Optional<PatientRegistration> findByUhid(String uhid);
    List<PatientRegistration> findAllByOrderByIdAsc();

    @Query("""
            select p from PatientRegistration p
            where lower(p.uhid) like lower(concat('%', :q, '%'))
               or lower(p.firstName) like lower(concat('%', :q, '%'))
               or lower(p.lastName) like lower(concat('%', :q, '%'))
            order by p.id
            """)
    List<PatientRegistration> search(@Param("q") String q);
}
