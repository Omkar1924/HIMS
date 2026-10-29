package com.hims.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "medical_service")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class MedicalService {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String category;   // XRAY, MRI, LAB...

    @Column(precision = 38, scale = 2, nullable = false)
    private BigDecimal charge;
}