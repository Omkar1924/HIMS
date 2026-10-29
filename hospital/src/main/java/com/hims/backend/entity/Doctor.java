package com.hims.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doctor")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String dname;

    private String specialization;

    @Column(precision = 38, scale = 2)
    private BigDecimal fee;

    private String qualification;

    @Column(name = "registration_no")
    private String registrationNo;
}