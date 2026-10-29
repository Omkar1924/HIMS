package com.hims.backend.entity;

import java.math.BigDecimal;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bill_item")
@Getter @Setter @NoArgsConstructor
public class BillItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bill_id", nullable = false)
    private Bill bill;

    @Column(name = "service_name")
    private String serviceName;

    private String category;

    @Column(precision = 38, scale = 2)
    private BigDecimal charge;

    private Integer quantity;

    @Column(precision = 38, scale = 2)
    private BigDecimal amount;   // charge x quantity
}