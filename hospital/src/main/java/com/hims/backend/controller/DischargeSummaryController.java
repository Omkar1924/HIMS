package com.hims.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.hims.backend.dto.DischargeDtos.ApproveSummary;
import com.hims.backend.dto.DischargeDtos.CreateSummary;
import com.hims.backend.dto.DischargeDtos.ReturnToNurse;
import com.hims.backend.dto.DischargeDtos.SummaryResponse;
import com.hims.backend.dto.DischargeDtos.UpdateSummary;
import com.hims.backend.services.DischargeSummaryService;

@RestController
@RequestMapping("/api/discharge-summaries")
@CrossOrigin(origins = "http://localhost:5173")
public class DischargeSummaryController {

    private final DischargeSummaryService service;

    public DischargeSummaryController(DischargeSummaryService service) {
        this.service = service;
    }

    @PostMapping
    public SummaryResponse create(@RequestBody CreateSummary in) {
        return service.create(in);
    }

    @GetMapping
    public List<SummaryResponse> search(
            @RequestParam(name = "patientUhid", required = false) String patientUhid,
            @RequestParam(name = "doctorId", required = false) Long doctorId,
            @RequestParam(name = "status", required = false) String status) {
        return service.search(patientUhid, doctorId, status);
    }

    @GetMapping("/{id}")
    public SummaryResponse get(@PathVariable("id") Long id) {
        return service.get(id);
    }

    @PutMapping("/{id}")
    public SummaryResponse update(@PathVariable("id") Long id, @RequestBody UpdateSummary in) {
        return service.update(id, in);
    }

    @PostMapping("/{id}/submit")
    public SummaryResponse submit(@PathVariable("id") Long id) {
        return service.submit(id);
    }

    @PostMapping("/{id}/return")
    public SummaryResponse returnToNurse(@PathVariable("id") Long id,
                                         @RequestBody(required = false) ReturnToNurse in) {
        return service.returnToNurse(id, in);
    }

    @PostMapping("/{id}/approve")
    public SummaryResponse approve(@PathVariable("id") Long id,
                                   @RequestBody(required = false) ApproveSummary in) {
        return service.approve(id, in);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") Long id) {
        service.delete(id);
    }
}