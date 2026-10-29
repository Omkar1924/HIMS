package com.hims.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "patient_report")
@Getter @Setter @NoArgsConstructor
public class PatientReport {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_no", unique = true)
    private String reportNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private ReportTemplate template;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "referring_doctor_id", nullable = false)
    private Doctor referringDoctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewing_doctor_id")
    private Doctor reviewingDoctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_service_id")
    private MedicalService medicalService;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bill_item_id")
    private BillItem billItem;

    @Column(name = "visit_type")
    private String visitType;

    @Column(nullable = false)
    private String category;

    @Column(name = "test_name")
    private String testName;

    @Column(name = "content_json", nullable = false, columnDefinition = "text")
    private String contentJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.DRAFT;

    @Column(name = "doctor_comment", columnDefinition = "text")
    private String doctorComment;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "department")        private String department;       // LAB, XRAY, MRI, CT, USG
    @Column(name = "department_remark") private String departmentRemark;
    @Column(name = "filled_by")         private String filledBy;
    @Column(name = "sent_to_dept_at")   private LocalDateTime sentToDeptAt;
    @Column(name = "returned_at")       private LocalDateTime returnedAt;

    @PrePersist void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate  void onUpdate() { updatedAt = LocalDateTime.now(); }
}