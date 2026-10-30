package com.hims.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "final_bill")
@Getter @Setter @NoArgsConstructor
public class FinalBill {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "final_no", unique = true)
    private String finalNo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private PatientRegistration patient;

    @Column(name = "total_billed", precision = 38, scale = 2)
    private BigDecimal totalBilled;

    @Column(name = "paid_before", precision = 38, scale = 2)
    private BigDecimal paidBefore;

    @Column(name = "deposit_used", precision = 38, scale = 2)
    private BigDecimal depositUsed;

    @Column(name = "amount_collected", precision = 38, scale = 2)
    private BigDecimal amountCollected;

    @Column(name = "refund_amount", precision = 38, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "finalBill")
    private List<Bill> bills = new ArrayList<>();

    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); }
}