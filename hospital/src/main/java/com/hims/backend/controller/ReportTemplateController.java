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

import com.hims.backend.entity.ReportTemplate;
import com.hims.backend.services.ReportTemplateService;

@RestController
@RequestMapping("/api/report-templates")
@CrossOrigin(origins = "http://localhost:5173")

public class ReportTemplateController {

    private final ReportTemplateService service;
    public ReportTemplateController(ReportTemplateService service) { this.service = service; }

    @GetMapping
    public List<ReportTemplate> list(
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "includeInactive", defaultValue = "false") boolean includeInactive) {
        return service.list(category, includeInactive);
    }

    @GetMapping("/{id}")
    public ReportTemplate get(@PathVariable("id") Long id) { return service.get(id); }

    @PostMapping
    public ReportTemplate create(@RequestBody ReportTemplate t,
                                 @RequestParam(name = "replace", defaultValue = "false") boolean replace) {
        return service.save(null, t, replace);
    }

    @PutMapping("/{id}")
    public ReportTemplate update(@PathVariable("id") Long id, @RequestBody ReportTemplate t,
                                 @RequestParam(name = "replace", defaultValue = "false") boolean replace) {
        return service.save(id, t, replace);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") Long id) { service.delete(id); }

    @PostMapping("/{id}/duplicate")
    public ReportTemplate duplicate(@PathVariable("id") Long id,
                                    @RequestParam(name = "name", required = false) String name) {
        return service.duplicate(id, name);
    }
}