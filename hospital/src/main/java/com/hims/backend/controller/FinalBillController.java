package com.hims.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.hims.backend.dto.BillDtos.CheckoutPreview;
import com.hims.backend.dto.BillDtos.CheckoutRequest;
import com.hims.backend.dto.BillDtos.FinalBillResponse;
import com.hims.backend.services.BillService;

@RestController
@RequestMapping("/api/final-bills")
@CrossOrigin(origins = "http://localhost:5173")
public class FinalBillController {

    private final BillService service;
    public FinalBillController(BillService service) { this.service = service; }

    @GetMapping("/preview/{uhid}")
    public CheckoutPreview preview(@PathVariable("uhid") String uhid) {
        return service.checkoutPreview(uhid);
    }

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public FinalBillResponse checkout(@RequestBody CheckoutRequest req) {
        return service.checkout(req);
    }

    @GetMapping
    public List<FinalBillResponse> list(@RequestParam(name = "q", defaultValue = "") String q) {
        return service.finalBills(q);
    }
}