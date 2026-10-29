package com.hims.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hims.backend.entity.BillItem;
import com.hims.backend.entity.PatientReport;
import com.hims.backend.entity.ReportStatus;

public interface PatientReportRepository extends JpaRepository<PatientReport, Long> {

    @EntityGraph(attributePaths = {"patient", "referringDoctor", "reviewingDoctor", "template", "medicalService"})
    Optional<PatientReport> findWithRelationsById(Long id);

    @EntityGraph(attributePaths = {"patient", "referringDoctor", "reviewingDoctor"})
    List<PatientReport> findByPatientUhidOrderByCreatedAtDesc(String uhid);

    @EntityGraph(attributePaths = {"patient", "referringDoctor", "reviewingDoctor"})
    List<PatientReport> findByReferringDoctorIdOrderByCreatedAtDesc(Long doctorId);

    @EntityGraph(attributePaths = {"patient", "referringDoctor", "reviewingDoctor"})
    List<PatientReport> findByReviewingDoctorIdAndStatusOrderByUpdatedAtDesc(Long doctorId, ReportStatus status);

    @EntityGraph(attributePaths = {"patient", "referringDoctor", "reviewingDoctor"})
    List<PatientReport> findByStatusOrderByUpdatedAtDesc(ReportStatus status);

    @EntityGraph(attributePaths = {"patient", "referringDoctor", "reviewingDoctor"})
    List<PatientReport> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"patient", "referringDoctor", "reviewingDoctor"})
    List<PatientReport> findByDepartmentAndStatusOrderByUpdatedAtDesc(String department, ReportStatus status);

    boolean existsByBillItemId(Long billItemId);

    @EntityGraph(attributePaths = {"patient", "referringDoctor", "reviewingDoctor"})
    List<PatientReport> findByCategoryOrderByCreatedAtDesc(String category);

    @EntityGraph(attributePaths = {"patient", "referringDoctor", "reviewingDoctor"})
    List<PatientReport> findByPatientUhidAndCategoryOrderByCreatedAtDesc(String uhid, String category);

    // worklist: billed lab/radiology items that have no report yet (read-only on billing tables)
    @Query("""
           select bi from BillItem bi
           join fetch bi.bill b join fetch b.patient join fetch b.doctor
           where bi.category in :cats
             and not exists (select 1 from PatientReport r where r.billItem = bi)
           order by b.createdAt desc
           """)
    List<BillItem> findPendingTests(@Param("cats") List<String> categories);
}