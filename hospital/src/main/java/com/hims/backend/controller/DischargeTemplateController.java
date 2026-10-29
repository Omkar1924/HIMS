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

import com.hims.backend.entity.DischargeTemplate;
import com.hims.backend.services.DischargeTemplateService;

@RestController
@RequestMapping("/api/discharge-templates")
@CrossOrigin(origins = "http://localhost:5173")
public class DischargeTemplateController {

    private final DischargeTemplateService service;

    public DischargeTemplateController(DischargeTemplateService service) {
        this.service = service;
    }

    @GetMapping
    public List<DischargeTemplate> list(
            @RequestParam(name = "includeInactive", defaultValue = "false") boolean includeInactive) {
        return service.list(includeInactive);
    }

    @GetMapping("/{id}")
    public DischargeTemplate get(@PathVariable("id") Long id) {
        return service.get(id);
    }

    @PostMapping
    public DischargeTemplate create(@RequestBody DischargeTemplate t,
                                    @RequestParam(name = "replace", defaultValue = "false") boolean replace) {
        return service.save(null, t, replace);
    }

    @PutMapping("/{id}")
    public DischargeTemplate update(@PathVariable("id") Long id, @RequestBody DischargeTemplate t,
                                    @RequestParam(name = "replace", defaultValue = "false") boolean replace) {
        return service.save(id, t, replace);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") Long id) {
        service.delete(id);
    }
}