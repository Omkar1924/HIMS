package com.hims.backend.services;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.hims.backend.entity.DischargeTemplate;
import com.hims.backend.repository.DischargeTemplateRepository;

@Service
public class DischargeTemplateService {

    private final DischargeTemplateRepository repo;

    public DischargeTemplateService(DischargeTemplateRepository repo) {
        this.repo = repo;
    }

    private static ResponseStatusException err(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }

    @Transactional(readOnly = true)
    public List<DischargeTemplate> list(boolean includeInactive) {
        return includeInactive
                ? repo.findAllByOrderByNameAsc()
                : repo.findByActiveTrueOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public DischargeTemplate get(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> err(HttpStatus.NOT_FOUND, "Template not found"));
    }

    /**
     * id == null: create a template.
     * replace == true: overwrite a template with the same name.
     */
    @Transactional
    public DischargeTemplate save(Long id, DischargeTemplate in, boolean replace) {

        if (in.getName() == null || in.getName().isBlank()) {
            throw err(HttpStatus.BAD_REQUEST, "Template name is required");
        }

        if (in.getSectionsJson() == null || in.getSectionsJson().isBlank()) {
            throw err(HttpStatus.BAD_REQUEST, "At least one section is required");
        }

        DischargeTemplate template = id != null ? get(id) : new DischargeTemplate();

        Optional<DischargeTemplate> sameName = repo.findByNameIgnoreCase(in.getName().trim());

        if (sameName.isPresent() && !sameName.get().getId().equals(template.getId())) {
            if (!replace) {
                throw err(HttpStatus.CONFLICT, "Template name already exists");
            }
            template = sameName.get();
        }

        template.setTemplateCode(in.getTemplateCode());
        template.setName(in.getName().trim());
        template.setDocumentTitle(in.getDocumentTitle() == null || in.getDocumentTitle().isBlank()
                ? "PATIENT DISCHARGE SUMMARY"
                : in.getDocumentTitle());
        template.setActive(in.isActive());
        template.setDoctor(in.getDoctor());
        template.setEmployee(in.getEmployee());
        template.setSectionsJson(in.getSectionsJson());
        // Track who created the template (doctor or employee).
        if (in.getCreatedBy() != null && !in.getCreatedBy().isBlank()) {
            template.setCreatedBy(in.getCreatedBy().trim());
        }

        // Update only when supplied, so an omitted field does not erase an existing value.
        if (in.getCentreName() != null) {
            template.setCentreName(in.getCentreName());
        }
        if (in.getCentreAddress() != null) {
            template.setCentreAddress(in.getCentreAddress());
        }
        if (in.getCentrePhone() != null) {
            template.setCentrePhone(in.getCentrePhone());
        }
        if (in.getLogoUrl() != null) {
            template.setLogoUrl(in.getLogoUrl());
        }
        if (in.getLayoutJson() != null) {
            template.setLayoutJson(in.getLayoutJson());
        }

        return repo.save(template);
    }

    /** Soft delete: summaries already using this template keep working. */
    @Transactional
    public void delete(Long id) {
        DischargeTemplate template = get(id);
        template.setActive(false);
        repo.save(template);
    }
}