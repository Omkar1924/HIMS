package com.hims.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "employee")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "employee_id")
    private Long id;
    private String userName;
    private String firstName;
    private String lastName;

    private String middleName;

    private String salutation;
    private String dateOfBirth;
    private String gender;
    private String kmpdcNo;
    private String knncNo;
    private String knhpcNo;
    private String contactNumber;
    private String emailId;
    private String signatureShort;
    private String signatureLong;
    private String dateOfJoining;
    private String contactAddress;
    private String kraPin;
    private Double taxPercentage;
    private String isIncentiveApplicable;
    private String extension;
    private String speedDial;
    private String officeHour;
    private String roomNo;
    private String bloodGroup;
    private String drivingLicenseNo;
    private String isActive;
    private String radiologySignature;
    private Integer displaySequence;

    @Column(columnDefinition = "text")
    private String signatureImage;

    private String appointmentApplicable;

    private String role;

    private String password;

//    AddDoctor mapping added by Sakshi on 26/11/25
    @ManyToOne
    @JoinColumn(name = "doctor")
    private AddDoctor doctor;

    @Lob
    private byte[] employeeSignature;

    // @ManyToOne(cascade = CascadeType.ALL) // Ensure cascade type includes SAVE_UPDATE
    // @JoinColumn(name = "department_id")
    // private Department department;

    // @ManyToOne(cascade = CascadeType.ALL) // Ensure cascade type includes SAVE_UPDATE
    // @JoinColumn(name = "employee_role_id")
    // private EmployeeRole employeeRole;

    // @ManyToOne(cascade = CascadeType.ALL) // Ensure cascade type includes SAVE_UPDATE
    // @JoinColumn(name = "employee_type_id")
    // private EmployeeType employeeType;

    // @ManyToMany
    // private List<Floor> floors;

    // @ManyToMany
    // private List<ServiceDetails> serviceDetails;

    // @ManyToMany
    // private List<LocationMaster> locationMasters;

}
