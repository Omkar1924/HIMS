package com.hims.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class BillDtos {

    public record ItemRequest(Long serviceId, Integer quantity) {}

    public record BillRequest(String uhid, List<ItemRequest> items, BigDecimal paidAmount,
                              String paymentMode, Boolean useDeposit) {}

    public record PaymentRequest(BigDecimal amount, String mode) {}

    public record PatientPrefill(String uhid, String patientName, Integer age, String contact,
                                 Long doctorId, String doctorName, String specialization,
                                 BigDecimal doctorFee, BigDecimal depositAvailable) {}

    public record ItemDto(String serviceName, String category, BigDecimal charge,
                          Integer quantity, BigDecimal amount) {}

    public record PaymentDto(BigDecimal amount, String mode, LocalDateTime paidAt) {}

    public record BillResponse(String billNo, String uhid, String patientName,
                               String doctorName, BigDecimal doctorFee,
                               List<ItemDto> items, BigDecimal servicesTotal,
                               BigDecimal totalAmount, BigDecimal paidAmount,
                               BigDecimal balance, String status,
                               LocalDateTime createdAt, List<PaymentDto> payments,
                               BigDecimal depositAvailable, BigDecimal refundable,
                               String finalNo) {}

    // ----- deposits -----
    public record DepositRequest(String uhid, BigDecimal amount, String mode) {}

    public record DepositTxnDto(String type, BigDecimal amount, String mode,
                                String billNo, String note, LocalDateTime createdAt) {}

    public record DepositSummary(String uhid, String patientName, BigDecimal deposited,
                                 BigDecimal adjusted, BigDecimal refunded,
                                 BigDecimal available, BigDecimal outstanding,
                                 BigDecimal refundable, List<DepositTxnDto> history) {}

    // ----- final bill -----
    public record CheckoutRequest(String uhid, BigDecimal payAmount,
                                  String payMode, String refundMode) {}

    public record CheckoutPreview(String uhid, String patientName, List<BillResponse> bills,
                                  BigDecimal totalBilled, BigDecimal totalPaid,
                                  BigDecimal totalBalance, BigDecimal depositAvailable,
                                  BigDecimal depositToUse, BigDecimal amountToPay,
                                  BigDecimal refundAmount) {}

    public record FinalBillResponse(String finalNo, String uhid, String patientName,
                                    List<String> billNos, BigDecimal totalBilled,
                                    BigDecimal paidBefore, BigDecimal depositUsed,
                                    BigDecimal amountCollected, BigDecimal refundAmount,
                                    LocalDateTime createdAt) {}
}