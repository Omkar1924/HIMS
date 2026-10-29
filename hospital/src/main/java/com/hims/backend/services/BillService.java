package com.hims.backend.services;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.function.Function;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.hims.backend.dto.BillDtos.BillRequest;
import com.hims.backend.dto.BillDtos.BillResponse;
import com.hims.backend.dto.BillDtos.CheckoutPreview;
import com.hims.backend.dto.BillDtos.CheckoutRequest;
import com.hims.backend.dto.BillDtos.DepositRequest;
import com.hims.backend.dto.BillDtos.DepositSummary;
import com.hims.backend.dto.BillDtos.DepositTxnDto;
import com.hims.backend.dto.BillDtos.FinalBillResponse;
import com.hims.backend.dto.BillDtos.ItemDto;
import com.hims.backend.dto.BillDtos.ItemRequest;
import com.hims.backend.dto.BillDtos.PatientPrefill;
import com.hims.backend.dto.BillDtos.PaymentDto;
import com.hims.backend.dto.BillDtos.PaymentRequest;
import com.hims.backend.entity.Bill;
import com.hims.backend.entity.BillItem;
import com.hims.backend.entity.BillStatus;
import com.hims.backend.entity.DepositTxn;
import com.hims.backend.entity.DepositType;
import com.hims.backend.entity.Doctor;
import com.hims.backend.entity.FinalBill;
import com.hims.backend.entity.MedicalService;
import com.hims.backend.entity.Patient;
import com.hims.backend.entity.Payment;
import com.hims.backend.entity.PaymentMode;
import com.hims.backend.exception.PatientNotFoundException;
import com.hims.backend.repository.BillRepository;
import com.hims.backend.repository.DepositTxnRepository;
import com.hims.backend.repository.FinalBillRepository;
import com.hims.backend.repository.MedicalServiceRepository;
import com.hims.backend.repository.PatientRepository;

@Service
public class BillService {

    private final BillRepository billRepository;
    private final PatientRepository patientRepository;
    private final MedicalServiceRepository serviceRepository;
    private final DepositTxnRepository depositRepository;
    private final FinalBillRepository finalBillRepository;

    public BillService(BillRepository billRepository, PatientRepository patientRepository,
                       MedicalServiceRepository serviceRepository,
                       DepositTxnRepository depositRepository,
                       FinalBillRepository finalBillRepository) {
        this.billRepository = billRepository;
        this.patientRepository = patientRepository;
        this.serviceRepository = serviceRepository;
        this.depositRepository = depositRepository;
        this.finalBillRepository = finalBillRepository;
    }

    // ================= helpers =================
    private ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    private String fullName(Patient p) {
        return (p.getFirstName() + " " + (p.getLastName() == null ? "" : p.getLastName())).trim();
    }

    private Patient findPatient(String uhid) {
        return patientRepository.findByUhid(uhid).orElseThrow(() -> new PatientNotFoundException(uhid));
    }

    private BigDecimal balanceOf(Bill b) {
        return b.getTotalAmount().subtract(b.getPaidAmount());
    }

    private BigDecimal sum(List<Bill> bills, Function<Bill, BigDecimal> f) {
        return bills.stream().map(f).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private PaymentMode parseMode(String mode) {
        if (mode == null || mode.isBlank()) {
            throw bad("Payment mode is required. Allowed: " + paymentModes());
        }
        PaymentMode pm;
        try {
            pm = PaymentMode.valueOf(mode.trim().toUpperCase().replace(' ', '_'));
        } catch (IllegalArgumentException e) {
            throw bad("Invalid payment mode: " + mode + ". Allowed: " + paymentModes());
        }
        if (pm == PaymentMode.DEPOSIT) {
			throw bad("Use the deposit option to pay from deposit");
		}
        return pm;
    }

    public List<String> paymentModes() {
        return Arrays.stream(PaymentMode.values())
                .filter(m -> m != PaymentMode.DEPOSIT)
                .map(Enum::name).toList();
    }

    // ================= deposit ledger =================
    private BigDecimal depositBalance(Long pid) {
        return depositRepository.sumByType(pid, DepositType.DEPOSIT)
                .subtract(depositRepository.sumByType(pid, DepositType.ADJUSTED))
                .subtract(depositRepository.sumByType(pid, DepositType.REFUND));
    }

    private BigDecimal outstanding(Long pid) {
        return billRepository.findByPatientIdAndFinalBillIsNullOrderByIdAsc(pid).stream()
                .map(this::balanceOf).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal refundableOf(Long pid) {
        return depositBalance(pid).subtract(outstanding(pid)).max(BigDecimal.ZERO);
    }

    private void saveDeposit(Patient p, Bill bill, DepositType type, BigDecimal amount,
                             PaymentMode mode, String note) {
        DepositTxn t = new DepositTxn();
        t.setPatient(p);
        t.setBill(bill);
        t.setType(type);
        t.setAmount(amount);
        t.setMode(mode);
        t.setNote(note);
        depositRepository.save(t);
    }

    @Transactional
    public DepositSummary addDeposit(DepositRequest req) {
        if (req.uhid() == null || req.uhid().isBlank()) {
			throw bad("UHID is required");
		}
        if (req.amount() == null || req.amount().signum() <= 0) {
			throw bad("Deposit amount must be greater than 0");
		}
        Patient p = findPatient(req.uhid());
        saveDeposit(p, null, DepositType.DEPOSIT, req.amount(), parseMode(req.mode()), "Advance deposit");
        return depositSummaryFor(p);
    }

    @Transactional(readOnly = true)
    public DepositSummary depositSummary(String uhid) {
        return depositSummaryFor(findPatient(uhid));
    }

    private DepositSummary depositSummaryFor(Patient p) {
        Long pid = p.getId();
        BigDecimal dep = depositRepository.sumByType(pid, DepositType.DEPOSIT);
        BigDecimal adj = depositRepository.sumByType(pid, DepositType.ADJUSTED);
        BigDecimal ref = depositRepository.sumByType(pid, DepositType.REFUND);
        BigDecimal avail = dep.subtract(adj).subtract(ref);
        BigDecimal out = outstanding(pid);
        List<DepositTxnDto> history = depositRepository.findByPatientIdOrderByIdDesc(pid).stream()
                .map(t -> new DepositTxnDto(t.getType().name(), t.getAmount(),
                        t.getMode() == null ? null : t.getMode().name(),
                        t.getBill() == null ? null : t.getBill().getBillNo(),
                        t.getNote(), t.getCreatedAt()))
                .toList();
        return new DepositSummary(p.getUhid(), fullName(p), dep, adj, ref, avail, out,
                avail.subtract(out).max(BigDecimal.ZERO), history);
    }

    // ================= patient search + autofill =================
    @Transactional(readOnly = true)
    public List<PatientPrefill> searchPatients(String q) {
        return patientRepository.search(q == null ? "" : q.trim()).stream().map(this::toPrefill).toList();
    }

    @Transactional(readOnly = true)
    public PatientPrefill prefill(String uhid) {
        return toPrefill(findPatient(uhid));
    }

    private PatientPrefill toPrefill(Patient p) {
        Doctor d = p.getDoctor();
        return new PatientPrefill(p.getUhid(), fullName(p), p.getAge(), p.getContact(),
                d.getId(), d.getDname(), d.getSpecialization(),
                d.getFee() == null ? BigDecimal.ZERO : d.getFee(),
                depositBalance(p.getId()));
    }

    // ================= create bill =================
    @Transactional
    public BillResponse create(BillRequest req) {
        if (req.uhid() == null || req.uhid().isBlank()) {
			throw bad("UHID is required");
		}

        Patient p = findPatient(req.uhid());
        Doctor d = p.getDoctor();
        BigDecimal doctorFee = d.getFee() == null ? BigDecimal.ZERO : d.getFee();

        Bill bill = new Bill();
        bill.setPatient(p);
        bill.setDoctor(d);
        bill.setDoctorFee(doctorFee);

        BigDecimal servicesTotal = BigDecimal.ZERO;
        if (req.items() != null) {
            for (ItemRequest ir : req.items()) {
                MedicalService s = serviceRepository.findById(ir.serviceId())
                        .orElseThrow(() -> bad("Service not found: " + ir.serviceId()));
                int qty = (ir.quantity() == null || ir.quantity() < 1) ? 1 : ir.quantity();

                BillItem item = new BillItem();
                item.setBill(bill);
                item.setServiceName(s.getName());
                item.setCategory(s.getCategory());
                item.setCharge(s.getCharge());
                item.setQuantity(qty);
                item.setAmount(s.getCharge().multiply(BigDecimal.valueOf(qty)));
                bill.getItems().add(item);
                servicesTotal = servicesTotal.add(item.getAmount());
            }
        }
        bill.setServicesTotal(servicesTotal);
        bill.setTotalAmount(doctorFee.add(servicesTotal));
        bill.setPaidAmount(BigDecimal.ZERO);
        bill.setStatus(BillStatus.PENDING);

        bill = billRepository.save(bill);
        bill.setBillNo(String.format("BILL%04d", bill.getId()));

        // 1) use existing deposit first (if requested)
        if (Boolean.TRUE.equals(req.useDeposit())) {
            BigDecimal use = depositBalance(p.getId()).min(bill.getTotalAmount());
            if (use.signum() > 0) {
				applyDepositToBill(bill, use);
			}
        }
        // 2) then the amount paid now (excess goes to deposit)
        if (req.paidAmount() != null && req.paidAmount().signum() > 0) {
            applyPayment(bill, req.paidAmount(), req.paymentMode());
        } else {
            refreshStatus(bill);
        }
        return toResponse(billRepository.save(bill));
    }

    // ================= payments =================
    @Transactional
    public BillResponse addPayment(String billNo, PaymentRequest req) {
        Bill bill = findBill(billNo);
        applyPayment(bill, req.amount(), req.mode());
        return toResponse(billRepository.save(bill));
    }

    @Transactional
    public BillResponse payFromDeposit(String billNo) {
        Bill bill = findBill(billNo);
        if (bill.getFinalBill() != null) {
			throw bad("Bill is already finalized");
		}
        BigDecimal balance = balanceOf(bill);
        if (balance.signum() <= 0) {
			throw bad("Bill is already fully paid");
		}
        BigDecimal available = depositBalance(bill.getPatient().getId());
        if (available.signum() <= 0) {
			throw bad("No deposit available for this patient");
		}
        applyDepositToBill(bill, available.min(balance));
        return toResponse(billRepository.save(bill));
    }

    /** Pays up to the balance; anything extra is stored as deposit. */
    private void applyPayment(Bill bill, BigDecimal amount, String mode) {
        if (amount == null || amount.signum() <= 0) {
			throw bad("Payment amount must be greater than 0");
		}
        if (bill.getFinalBill() != null) {
			throw bad("Bill is already finalized");
		}
        PaymentMode pm = parseMode(mode);

        BigDecimal toBill = amount.min(balanceOf(bill));
        BigDecimal extra = amount.subtract(toBill);

        if (toBill.signum() > 0) {
			recordPayment(bill, toBill, pm);
		} else {
			refreshStatus(bill);
		}
        if (extra.signum() > 0) {
            saveDeposit(bill.getPatient(), bill, DepositType.DEPOSIT, extra, pm,
                    "Excess payment on " + bill.getBillNo());
        }
    }

    private void applyDepositToBill(Bill bill, BigDecimal amount) {
        saveDeposit(bill.getPatient(), bill, DepositType.ADJUSTED, amount, null,
                "Adjusted against " + bill.getBillNo());
        recordPayment(bill, amount, PaymentMode.DEPOSIT);
    }

    private void recordPayment(Bill bill, BigDecimal amount, PaymentMode pm) {
        Payment pay = new Payment();
        pay.setBill(bill);
        pay.setAmount(amount);
        pay.setMode(pm);
        bill.getPayments().add(pay);
        bill.setPaidAmount(bill.getPaidAmount().add(amount));
        refreshStatus(bill);
    }

    private void refreshStatus(Bill bill) {
        if (bill.getPaidAmount().compareTo(bill.getTotalAmount()) >= 0) {
			bill.setStatus(BillStatus.PAID);
		} else if (bill.getPaidAmount().signum() > 0) {
			bill.setStatus(BillStatus.PARTIAL);
		} else {
			bill.setStatus(BillStatus.PENDING);
		}
    }

    // ================= final bill / checkout =================
    @Transactional(readOnly = true)
    public CheckoutPreview checkoutPreview(String uhid) {
        Patient p = findPatient(uhid);
        return buildPreview(p, billRepository.findByPatientIdAndFinalBillIsNullOrderByIdAsc(p.getId()));
    }

    private CheckoutPreview buildPreview(Patient p, List<Bill> bills) {
        BigDecimal billed = sum(bills, Bill::getTotalAmount);
        BigDecimal paid = sum(bills, Bill::getPaidAmount);
        BigDecimal balance = billed.subtract(paid);
        BigDecimal avail = depositBalance(p.getId());
        BigDecimal use = avail.min(balance);
        return new CheckoutPreview(p.getUhid(), fullName(p),
                bills.stream().map(this::toResponse).toList(),
                billed, paid, balance, avail, use,
                balance.subtract(use), avail.subtract(use));
    }

    @Transactional
    public FinalBillResponse checkout(CheckoutRequest req) {
        if (req.uhid() == null || req.uhid().isBlank()) {
			throw bad("UHID is required");
		}
        Patient p = findPatient(req.uhid());
        List<Bill> bills = billRepository.findByPatientIdAndFinalBillIsNullOrderByIdAsc(p.getId());
        if (bills.isEmpty()) {
			throw bad("No open bills for this patient");
		}

        CheckoutPreview pv = buildPreview(p, bills);
        BigDecimal toPay = pv.amountToPay();
        BigDecimal refund = pv.refundAmount();

        PaymentMode payMode = null, refundMode = null;
        if (toPay.signum() > 0) {
            if (req.payAmount() == null || req.payAmount().compareTo(toPay) != 0) {
                throw bad("Collect exactly " + toPay + " to complete the final bill");
            }
            payMode = parseMode(req.payMode());
        }
        if (refund.signum() > 0) {
			refundMode = parseMode(req.refundMode());
		}

        // 1) apply deposit
        BigDecimal depositLeft = pv.depositToUse();
        for (Bill b : bills) {
            BigDecimal bal = balanceOf(b);
            if (bal.signum() <= 0 || depositLeft.signum() <= 0) {
				continue;
			}
            BigDecimal use = depositLeft.min(bal);
            applyDepositToBill(b, use);
            depositLeft = depositLeft.subtract(use);
        }
        // 2) collect remaining payment
        BigDecimal cashLeft = toPay;
        for (Bill b : bills) {
            BigDecimal bal = balanceOf(b);
            if (bal.signum() <= 0 || cashLeft.signum() <= 0) {
				continue;
			}
            BigDecimal part = cashLeft.min(bal);
            recordPayment(b, part, payMode);
            cashLeft = cashLeft.subtract(part);
        }
        // 3) refund leftover deposit
        if (refund.signum() > 0) {
            saveDeposit(p, null, DepositType.REFUND, refund, refundMode, "Refund at final checkout");
        }
        // 4) create final bill and lock the bills
        FinalBill fb = new FinalBill();
        fb.setPatient(p);
        fb.setTotalBilled(pv.totalBilled());
        fb.setPaidBefore(pv.totalPaid());
        fb.setDepositUsed(pv.depositToUse());
        fb.setAmountCollected(toPay);
        fb.setRefundAmount(refund);
        fb = finalBillRepository.save(fb);
        fb.setFinalNo(String.format("FINAL%04d", fb.getId()));
        for (Bill b : bills) {
            b.setFinalBill(fb);
            fb.getBills().add(b);
        }
        billRepository.saveAll(bills);
        return toFinal(fb);
    }

    @Transactional(readOnly = true)
    public List<FinalBillResponse> finalBills(String q) {
        String s = q == null ? "" : q.trim().toLowerCase();
        return finalBillRepository.findAllByOrderByIdDesc().stream()
                .filter(f -> s.isEmpty()
                        || f.getFinalNo().toLowerCase().contains(s)
                        || f.getPatient().getUhid().toLowerCase().contains(s)
                        || fullName(f.getPatient()).toLowerCase().contains(s))
                .map(this::toFinal).toList();
    }

    private FinalBillResponse toFinal(FinalBill f) {
        Patient p = f.getPatient();
        return new FinalBillResponse(f.getFinalNo(), p.getUhid(), fullName(p),
                f.getBills().stream().map(Bill::getBillNo).toList(),
                f.getTotalBilled(), f.getPaidBefore(), f.getDepositUsed(),
                f.getAmountCollected(), f.getRefundAmount(), f.getCreatedAt());
    }

    // ================= read =================
    @Transactional(readOnly = true)
    public List<BillResponse> search(String q, String status) {
        String query = q == null ? "" : q.trim();
        List<Bill> bills;
        if (status == null || status.isBlank() || status.equalsIgnoreCase("ALL")) {
            bills = billRepository.search(query);
        } else {
            BillStatus st;
            try { st = BillStatus.valueOf(status.toUpperCase()); }
            catch (IllegalArgumentException e) { throw bad("Invalid status: " + status); }
            bills = billRepository.searchByStatus(st, query);
        }
        return bills.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public BillResponse getByBillNo(String billNo) {
        return toResponse(findBill(billNo));
    }

    private Bill findBill(String billNo) {
        return billRepository.findByBillNo(billNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bill not found: " + billNo));
    }

    private BillResponse toResponse(Bill b) {
        Patient p = b.getPatient();
        return new BillResponse(
                b.getBillNo(), p.getUhid(), fullName(p),
                b.getDoctor().getDname(), b.getDoctorFee(),
                b.getItems().stream().map(i -> new ItemDto(i.getServiceName(), i.getCategory(),
                        i.getCharge(), i.getQuantity(), i.getAmount())).toList(),
                b.getServicesTotal(), b.getTotalAmount(), b.getPaidAmount(),
                balanceOf(b), b.getStatus().name(), b.getCreatedAt(),
                b.getPayments().stream()
                        .map(x -> new PaymentDto(x.getAmount(), x.getMode().name(), x.getPaidAt())).toList(),
                depositBalance(p.getId()), refundableOf(p.getId()),
                b.getFinalBill() == null ? null : b.getFinalBill().getFinalNo());
    }
}