package com.hims.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hims.backend.entity.Patient;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByUhid(String uhid);
    List<Patient> findAllByOrderByIdAsc();

    @Query("""
    	    select p from Patient p
    	    where lower(p.uhid) like lower(concat('%', :q, '%'))
    	       or lower(p.firstName) like lower(concat('%', :q, '%'))
    	       or lower(p.lastName) like lower(concat('%', :q, '%'))
    	    order by p.id
    	    """)
    	List<Patient> search(@Param("q") String q);
}