
package com.hims.backend.services;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.hims.backend.entity.ReportTemplate;
import com.hims.backend.repository.ReportTemplateRepository;

@Service
public class ReportTemplateService {

    private final ReportTemplateRepository repo;

    public ReportTemplateService(ReportTemplateRepository repo) {
        this.repo = repo;
    }

    private static ResponseStatusException err(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }

    @Transactional(readOnly = true)
    public List<ReportTemplate> list(String category, boolean includeInactive) {
        boolean noCat = category == null || category.isBlank();

        if (includeInactive) {
            return noCat
                    ? repo.findAllByOrderByNameAsc()
                    : repo.findByCategoryOrderByNameAsc(category);
        }

        return noCat
                ? repo.findByActiveTrueOrderByNameAsc()
                : repo.findByCategoryAndActiveTrueOrderByNameAsc(category);
    }

    @Transactional(readOnly = true)
    public ReportTemplate get(Long id) {
        return repo.findById(id)
                .orElseThrow(() ->
                        err(HttpStatus.NOT_FOUND, "Template not found"));
    }

    /**
     * id == null: create a template.
     * replace == true: overwrite a template with the same name.
     */
    @Transactional
    public ReportTemplate save(Long id, ReportTemplate in, boolean replace) {

        if (in.getName() == null || in.getName().isBlank()) {
            throw err(HttpStatus.BAD_REQUEST, "Template name is required");
        }

        if (in.getCategory() == null || in.getCategory().isBlank()) {
            throw err(HttpStatus.BAD_REQUEST, "Category is required");
        }

        ReportTemplate template =
                id != null ? get(id) : new ReportTemplate();

        Optional<ReportTemplate> sameName =
                repo.findByNameIgnoreCase(in.getName().trim());

        if (sameName.isPresent()
                && !sameName.get().getId().equals(template.getId())) {

            if (!replace) {
                throw err(
                        HttpStatus.CONFLICT,
                        "Template name already exists"
                );
            }

            template = sameName.get();
        }

        // Basic template details
        template.setTemplateCode(in.getTemplateCode());
        template.setName(in.getName().trim());
        template.setCategory(in.getCategory().trim());
        template.setTestGroup(in.getTestGroup());
        template.setTestName(in.getTestName());

        template.setApplicableFor(
                in.getApplicableFor() == null
                        || in.getApplicableFor().isBlank()
                        ? "BOTH"
                        : in.getApplicableFor()
        );

        template.setLocation(in.getLocation());
        template.setActive(in.isActive());
        template.setDefaultTemplate(in.isDefaultTemplate());

        // Report section definitions
        template.setSectionsJson(in.getSectionsJson());

        // Organisation details
        // Update only when supplied, so an omitted field does not
        // accidentally erase an existing value.
        if (in.getCentreName() != null) {
            template.setCentreName(in.getCentreName());
        }

        if (in.getCentreAddress() != null) {
            template.setCentreAddress(in.getCentreAddress());
        }

        if (in.getCentrePhone() != null) {
            template.setCentrePhone(in.getCentrePhone());
        }

        // Logo: data URL or persistent URL supplied by the frontend.
        if (in.getLogoUrl() != null) {
            template.setLogoUrl(in.getLogoUrl());
        }

        // Preview positions and sizes, including the logo position.
        if (in.getLayoutJson() != null) {
            template.setLayoutJson(in.getLayoutJson());
        }

        ReportTemplate saved = repo.save(template);

        // Only one default template per category.
        if (saved.isDefaultTemplate()) {
            for (ReportTemplate other :
                    repo.findByCategoryOrderByNameAsc(saved.getCategory())) {

                if (!other.getId().equals(saved.getId())
                        && other.isDefaultTemplate()) {

                    other.setDefaultTemplate(false);
                    repo.save(other);
                }
            }
        }

        return saved;
    }

    /**
     * Soft delete: reports that already use this template keep working.
     */
    @Transactional
    public void delete(Long id) {
        ReportTemplate template = get(id);

        template.setActive(false);
        template.setDefaultTemplate(false);

        repo.save(template);
    }

    /**
     * Clone a template. The copy gets a new name and is NOT the default.
     */
    @Transactional
    public ReportTemplate duplicate(Long id, String newName) {
        ReportTemplate source = get(id);

        String candidateName = (newName != null && !newName.isBlank())
                ? newName.trim()
                : source.getName() + " (Copy)";

        // Ensure uniqueness
        String finalName = candidateName;
        int attempt = 2;
        while (repo.findByNameIgnoreCase(finalName).isPresent()) {
            finalName = candidateName + " " + attempt++;
        }

        ReportTemplate copy = new ReportTemplate();
        copy.setName(finalName);
        copy.setTemplateCode(source.getTemplateCode());
        copy.setCategory(source.getCategory());
        copy.setTemplateType(source.getTemplateType());
        copy.setTestGroup(source.getTestGroup());
        copy.setTestName(source.getTestName());
        copy.setApplicableFor(source.getApplicableFor());
        copy.setLocation(source.getLocation());
        copy.setActive(true);
        copy.setDefaultTemplate(false);
        copy.setSectionsJson(source.getSectionsJson());
        copy.setCentreName(source.getCentreName());
        copy.setCentreAddress(source.getCentreAddress());
        copy.setCentrePhone(source.getCentrePhone());
        copy.setLogoUrl(source.getLogoUrl());
        copy.setLayoutJson(source.getLayoutJson());

        return repo.save(copy);
    }
}
