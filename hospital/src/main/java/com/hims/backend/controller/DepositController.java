package com.hims.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.hims.backend.dto.BillDtos.DepositRequest;
import com.hims.backend.dto.BillDtos.DepositSummary;
import com.hims.backend.services.BillService;

@RestController
@RequestMapping("/api/deposits")
@CrossOrigin(origins = "http://localhost:5173")
public class DepositController {

    private final BillService service;
    public DepositController(BillService service) { this.service = service; }

    @GetMapping("/{uhid}")
    public DepositSummary summary(@PathVariable("uhid") String uhid) {
        return service.depositSummary(uhid);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DepositSummary add(@RequestBody DepositRequest req) {
        return service.addDeposit(req);
    }
}