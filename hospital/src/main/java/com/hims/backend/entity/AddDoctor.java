package com.hims.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "add_doctor")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class AddDoctor {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String doctorName;
    private String gender;
    private String dob;

    private String anniversaryDate;
    private String specialization;
    private String salutation;

    private String pancardNo;
    private String emailId;
    private String degree;
    private String title;
    private String registrationNo;
    private BigDecimal fee;

    private String employeeType;
    private String doctorType;
    private String typeOfConsultant;
    private String complemetType;

    private String residenceAddress;
    private String residenceCity;
    private String residenceDistrict;
    private String residenceState;
    private String residencePinCode;
    private String residencePhoneNo;
    private String mobileNumber;

    private String clinicAddress;
    private String clinicCity;
    private String clinicDistrict;
    private String clinicState;
    private String clinicPhoneNo;

    private String validSvNos;
    private String svValidDays;

    @Lob
    private byte[] doctorSignature;

    private String doctorAssistantNo;
    private String doctorAssistantDis;

    private boolean unitMaster;

//     @ManyToOne
//	 @JoinColumn(name = "specialisationId", nullable = false)
//	 private Specialisations specialisations;

  	// @OneToMany(mappedBy = "addDoctor", cascade = CascadeType.ALL)
  	// private List<OrgDoctorFee> doctorFees = new ArrayList<>();

  	// @OneToMany(mappedBy = "addDoctor", cascade = CascadeType.ALL)
  	// private List<PoolDetails> poolDetails = new ArrayList<>();


    public AddDoctor(Long id, String salutation, String doctorName) {
        this.id = id;
        this.salutation = salutation;
        this.doctorName = doctorName;
}
}
