package com.hims.backend.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
import org.springframework.web.multipart.MultipartFile;

import com.hims.backend.dto.ReportDtos.ApproveReport;
import com.hims.backend.dto.ReportDtos.CreateReport;
import com.hims.backend.dto.ReportDtos.ImageInfo;
import com.hims.backend.dto.ReportDtos.PendingTest;
import com.hims.backend.dto.ReportDtos.ReportResponse;
import com.hims.backend.dto.ReportDtos.ReturnToDoctor;
import com.hims.backend.dto.ReportDtos.SendForReview;
import com.hims.backend.dto.ReportDtos.SendToDepartment;
import com.hims.backend.dto.ReportDtos.UpdateReport;
import com.hims.backend.entity.ReportImage;
import com.hims.backend.services.PatientReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PatientReportController {

    private final PatientReportService service;

    @PostMapping
    public ReportResponse create(@RequestBody CreateReport q) { return service.create(q); }

    @GetMapping
    public List<ReportResponse> list(
            @RequestParam(name = "uhid", required = false) String uhid,
            @RequestParam(name = "referringDoctorId", required = false) Long referringDoctorId,
            @RequestParam(name = "reviewingDoctorId", required = false) Long reviewingDoctorId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "department", required = false) String department,
            @RequestParam(name = "category", required = false) String category) {
        return service.list(uhid, referringDoctorId, reviewingDoctorId, status, department, category);
    }

    @GetMapping("/{id}")
    public ReportResponse get(@PathVariable("id") Long id) { return service.get(id); }

    @PutMapping("/{id}")
    public ReportResponse update(@PathVariable("id") Long id, @RequestBody UpdateReport q) {
        return service.update(id, q);
    }

    @PostMapping("/{id}/send")
    public ReportResponse send(@PathVariable("id") Long id, @RequestBody SendForReview q) {
        return service.send(id, q);
    }

    @PostMapping("/{id}/approve")
    public ReportResponse approve(@PathVariable("id") Long id, @RequestBody ApproveReport q) {
        return service.approve(id, q);
    }

    @PostMapping("/{id}/reopen")
    public ReportResponse reopen(@PathVariable("id") Long id) { return service.reopen(id); }

    @PostMapping("/{id}/send-to-department")
    public ReportResponse sendToDept(@PathVariable("id") Long id, @RequestBody SendToDepartment q) {
        return service.sendToDepartment(id, q);
    }

    @PostMapping("/{id}/return")
    public ReportResponse returnToDoctor(@PathVariable("id") Long id, @RequestBody ReturnToDoctor q) {
        return service.returnToDoctor(id, q);
    }

    @GetMapping("/pending-tests")
    public List<PendingTest> pending(
            @RequestParam(name = "categories", defaultValue = "LAB,XRAY,MRI,CT,USG") List<String> categories) {
        return service.pendingTests(categories);
    }

    // ---------- images ----------

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImageInfo upload(@PathVariable("id") Long id,
                            @RequestParam("file") MultipartFile file,
                            @RequestParam(name = "caption", required = false) String caption) throws IOException {
        return service.addImage(id, file, caption);
    }

    @GetMapping("/images/{imageId}")
    public ResponseEntity<byte[]> image(@PathVariable("imageId") Long imageId) {
        ReportImage img = service.getImage(imageId);
        MediaType type = img.getContentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(img.getContentType());
        return ResponseEntity.ok()
                .contentType(type)
                .cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePrivate())
                .body(img.getData());
    }

    @DeleteMapping("/images/{imageId}")
    public void deleteImage(@PathVariable("imageId") Long imageId) { service.deleteImage(imageId); }
}