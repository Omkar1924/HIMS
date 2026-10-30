package com.hims.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.hims.backend.dto.BillDtos.BillRequest;
import com.hims.backend.dto.BillDtos.BillResponse;
import com.hims.backend.dto.BillDtos.PatientPrefill;
import com.hims.backend.dto.BillDtos.PaymentRequest;
import com.hims.backend.services.BillService;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = "http://localhost:5173",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class BillController {

    private final BillService service;

    public BillController(BillService service) { this.service = service; }

    // payment mode dropdown values
    @GetMapping("/payment-modes")
    public List<String> paymentModes() {
        return service.paymentModes();
    }

    // search patients by UHID or name (billing page search box)
    @GetMapping("/patients")
    public List<PatientPrefill> searchPatients(@RequestParam(name = "q", defaultValue = "") String q) {
        return service.searchPatients(q);
    }

    // autofill data for one patient
    @GetMapping("/prefill/{uhid}")
    public PatientPrefill prefill(@PathVariable("uhid") String uhid) {
        return service.prefill(uhid);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BillResponse create(@RequestBody BillRequest req) {
        return service.create(req);
    }

    // search bills by billNo / UHID / name, optional status filter
    @GetMapping
    public List<BillResponse> search(@RequestParam(name = "q", defaultValue = "") String q,
                                     @RequestParam(name = "status", required = false) String status) {
        return service.search(q, status);
    }

    @GetMapping("/{billNo}")
    public BillResponse get(@PathVariable("billNo") String billNo) {
        return service.getByBillNo(billNo);
    }

    @PostMapping("/{billNo}/payments")
    public BillResponse pay(@PathVariable("billNo") String billNo, @RequestBody PaymentRequest req) {
        return service.addPayment(billNo, req);
    }
}