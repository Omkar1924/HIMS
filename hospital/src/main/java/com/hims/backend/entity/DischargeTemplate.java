package com.hims.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "discharge_template")
@Getter
@Setter
@NoArgsConstructor
public class DischargeTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_code")
    private String templateCode;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "document_title")
    private String documentTitle = "PATIENT DISCHARGE SUMMARY";

    @Column(nullable = false)
    private boolean active = true;

    // Doctor who owns / created the template
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private AddDoctor doctor;

    // Employee who manages the template
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(name = "sections_json", columnDefinition = "text")
    private String sectionsJson;

    // Organisation details
    @Column(name = "centre_name")
    private String centreName;

    @Column(name = "centre_address", columnDefinition = "text")
    private String centreAddress;

    @Column(name = "centre_phone")
    private String centrePhone;

    @Column(name = "logo_url", columnDefinition = "text")
    private String logoUrl;

    // Preview element positions and dimensions
    @Column(name = "layout_json", columnDefinition = "text")
    private String layoutJson;

    @Column(name = "created_by")
    private String createdBy;

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