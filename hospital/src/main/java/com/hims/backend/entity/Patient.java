package com.hims.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "patient")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "uhid", unique = true)
    private String uhid;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "middle_name")
    private String middleName;

    @Column(name = "last_name")
    private String lastName;

    private String contact;
    private String email;
    private Integer age;

    @Column(name = "blood_group")
    private String bloodGroup;

    private String address;
    private Double height;
    private Double weight;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;


}