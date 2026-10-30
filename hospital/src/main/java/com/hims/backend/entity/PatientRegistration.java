package com.hims.backend.entity;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "patient_registration")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class PatientRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "patient_registration_id")
    private Long id;

    @Column(unique = true,nullable = false)
    private String uhid;

    private String salutation;
    private String firstName;
    private String middleName;
    private String lastName;
    private int age;
    private String ageUnit;

    @Column(unique = true)
    private String adharCardId;

    private String gender;
    private String dateOfBirth;
    private String maritalStatus;
    private String registrationDate;
    private String relation;
    private String relationName;
    private String religion;
    @Column(name = "patient_cast")
    private String cast;
    private String occupation;
    private String qualification;
    private String motherName;
    private String address;
    @Column(name = "blood_group")
    private String bloodGroup;
    private String areaVillage;
    private String cityDistrict;
    private String state;
    private String country;
    private String pinCode;
    private String mobileNumber;
    private String telNumberOff;
    private String telNumberRes;
    private String emailId;
    private String height;
    private String weight;
    private String sourceOfRegistration;
    private String remarks;
    private String previousHospital;
    private String referredContactNumber;
    private String nationality;
    private String incomeRange;
    private String contactNameInitial;
    private String contactName;
    private String contactRelation;
    private String telNumberRes1;
    private String telNumberOff1;
    private String contactNumber;
    private String isEmergency;
    private String erNo;
    private String gstin;
    private String pan;
    private String sponserType;
    private String eligibility;

    // @ManyToOne
    // private OrganisationMaster organisationMaster;

    private String policyNumber;
    private String policyStartDate;
    private String policyEndDate;

    @Column(name = "file_attachment", columnDefinition = "bytea")
    private byte[] fileAttachment;

    @ManyToMany
    @JoinTable(
            name = "patient_registration_doctor_mapping",
            joinColumns = @JoinColumn(name = "patient_registration_id"),
            inverseJoinColumns = @JoinColumn(name = "doctor_id")
    )
    private List<AddDoctor> addDoctor = new ArrayList<>();

    // Attending / referring doctor (single reference, mirrored on bill & discharge summary)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private AddDoctor doctor;

    // Denormalized doctor details copied at registration time
    private String doctorDname;
    private String doctorSpecialization;
    private BigDecimal doctorFee;
    private String doctorQualification;
    private String doctorRegistrationNo;

    private String contact;

//    @OneToMany(mappedBy = "patient")
//    private List<Claim> claims;
//
//    @OneToMany(mappedBy = "patient")
//    private List<Insurance> insuranceList;

    public String xtra1;
    public String xtra2;
    public String xtra3;
    public String xtra4;
    public String xtra5;
    public String xtra6;
    public String xtra7;
    public String xtra8;
    public String xtra9;
    public String xtra10;

}
