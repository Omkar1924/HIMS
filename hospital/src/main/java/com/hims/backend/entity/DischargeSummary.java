package com.hims.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "discharge_summary")
@Getter
@Setter
@NoArgsConstructor
public class DischargeSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "summary_no", unique = true)
    private String summaryNo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id")
    private DischargeTemplate template;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    // Doctor who reviews and approves
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @Column(name = "admission_date")
    private LocalDate admissionDate;

    @Column(name = "discharge_date")
    private LocalDate dischargeDate;

    // Nurse who entered the data
    @Column(name = "prepared_by")
    private String preparedBy;

    // Template sections copied at creation, with the nurse's answers filled in
    @Column(name = "sections_json", columnDefinition = "text")
    private String sectionsJson;

    // Final narrative per section, frozen on approval
    @Column(name = "rendered_json", columnDefinition = "text")
    private String renderedJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DischargeStatus status = DischargeStatus.DRAFT;

    @Column(name = "review_remark", columnDefinition = "text")
    private String reviewRemark;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    private String xtre1;
    private String xtre2;
    private String xtre3;
    private String xtre4;
    private String xtre5;
    private String xtre6;
    private String xtre7;
    private String xtre8;
    private String xtre9;
    private String xtre10;
}