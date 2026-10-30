package com.hims.backend.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.hims.backend.dto.DischargeDtos.ApproveSummary;
import com.hims.backend.dto.DischargeDtos.CreateSummary;
import com.hims.backend.dto.DischargeDtos.ReturnToNurse;
import com.hims.backend.dto.DischargeDtos.SummaryResponse;
import com.hims.backend.dto.DischargeDtos.UpdateSummary;
import com.hims.backend.dto.ReportDtos.DoctorInfo;
import com.hims.backend.dto.ReportDtos.PatientInfo;
import com.hims.backend.entity.AddDoctor;
import com.hims.backend.entity.DischargeStatus;
import com.hims.backend.entity.DischargeSummary;
import com.hims.backend.entity.DischargeTemplate;
import com.hims.backend.entity.PatientRegistration;
import com.hims.backend.exception.PatientNotFoundException;
import com.hims.backend.repository.AddDoctorRepository;
import com.hims.backend.repository.DischargeSummaryRepository;
import com.hims.backend.repository.DischargeTemplateRepository;
import com.hims.backend.repository.PatientRegistrationRepository;

@Service
public class DischargeSummaryService {

    private final DischargeSummaryRepository repo;
    private final DischargeTemplateRepository templateRepo;
    private final PatientRegistrationRepository patientRepo;
    private final AddDoctorRepository doctorRepo;
    private final NarrativeRenderer renderer;

    public DischargeSummaryService(DischargeSummaryRepository repo,
                                   DischargeTemplateRepository templateRepo,
                                   PatientRegistrationRepository patientRepo,
                                   AddDoctorRepository doctorRepo,
                                   NarrativeRenderer renderer) {
        this.repo = repo;
        this.templateRepo = templateRepo;
        this.patientRepo = patientRepo;
        this.doctorRepo = doctorRepo;
        this.renderer = renderer;
    }

    private static ResponseStatusException err(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }

    // ------------------------------------------------------------ create / read

    @Transactional
    public SummaryResponse create(CreateSummary in) {
        if (in.templateId() == null) {
            throw err(HttpStatus.BAD_REQUEST, "Template is required");
        }
        if (in.patientUhid() == null || in.patientUhid().isBlank()) {
            throw err(HttpStatus.BAD_REQUEST, "Patient UHID is required");
        }
        if (in.doctorId() == null) {
            throw err(HttpStatus.BAD_REQUEST, "Doctor is required");
        }

        DischargeTemplate template = templateRepo.findById(in.templateId())
                .orElseThrow(() -> err(HttpStatus.NOT_FOUND, "Template not found"));
        PatientRegistration patient = patientRepo.findByUhid(in.patientUhid().trim())
                .orElseThrow(() -> new PatientNotFoundException(in.patientUhid()));
        AddDoctor doctor = in.doctorId() != null
                ? doctorRepo.findById(in.doctorId())
                        .orElseThrow(() -> err(HttpStatus.NOT_FOUND, "Doctor not found"))
                : patient.getDoctor();

        DischargeSummary s = new DischargeSummary();
        s.setTemplate(template);
        s.setPatient(patient);
        s.setDoctor(doctor);
        s.setDoctorDname(doctor.getDoctorName());
        s.setDoctorSpecialization(doctor.getSpecialization());
        s.setDoctorFee(doctor.getFee());
        s.setDoctorQualification(doctor.getDegree());
        s.setDoctorRegistrationNo(doctor.getRegistrationNo());
        s.setAdmissionDate(in.admissionDate());
        s.setDischargeDate(in.dischargeDate());
        s.setPreparedBy(in.preparedBy());
        // Copy sections so later template edits never change an existing summary.
        s.setSectionsJson(isBlank(in.sectionsJson()) ? template.getSectionsJson() : in.sectionsJson());
        s.setStatus(DischargeStatus.DRAFT);

        DischargeSummary saved = repo.save(s);
        saved.setSummaryNo("DS-" + String.format("%06d", saved.getId()));
        return toResponse(repo.save(saved));
    }

    @Transactional(readOnly = true)
    public SummaryResponse get(Long id) {
        return toResponse(find(id));
    }

    @Transactional(readOnly = true)
    public List<SummaryResponse> search(String patientUhid, Long doctorId, String status) {
        DischargeStatus wanted = null;
        if (!isBlank(status)) {
            try {
                wanted = DischargeStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw err(HttpStatus.BAD_REQUEST, "Invalid status");
            }
        }
        final DischargeStatus statusFilter = wanted;

        return repo.findAllByOrderByCreatedAtDesc().stream()
                .filter(s -> isBlank(patientUhid)
                        || patientUhid.trim().equalsIgnoreCase(s.getPatient().getUhid()))
                .filter(s -> doctorId == null || doctorId.equals(s.getDoctor().getId()))
                .filter(s -> statusFilter == null || s.getStatus() == statusFilter)
                .map(this::toResponse)
                .toList();
    }

    // ------------------------------------------------------------ workflow

    @Transactional
    public SummaryResponse update(Long id, UpdateSummary in) {
        DischargeSummary s = find(id);
        requireNotApproved(s);

        if (in.admissionDate() != null) {
            s.setAdmissionDate(in.admissionDate());
        }
        if (in.dischargeDate() != null) {
            s.setDischargeDate(in.dischargeDate());
        }
        if (in.preparedBy() != null) {
            s.setPreparedBy(in.preparedBy());
        }
        if (!isBlank(in.sectionsJson())) {
            s.setSectionsJson(in.sectionsJson());
        }
        return toResponse(repo.save(s));
    }

    /** Nurse sends the summary to the doctor. */
    @Transactional
    public SummaryResponse submit(Long id) {
        DischargeSummary s = find(id);
        requireNotApproved(s);
        s.setStatus(DischargeStatus.PENDING_REVIEW);
        s.setReviewRemark(null);
        return toResponse(repo.save(s));
    }

    /** Doctor sends it back to the nurse with a remark. */
    @Transactional
    public SummaryResponse returnToNurse(Long id, ReturnToNurse in) {
        DischargeSummary s = find(id);
        requireNotApproved(s);
        s.setStatus(DischargeStatus.DRAFT);
        s.setReviewRemark(in == null ? null : in.remark());
        return toResponse(repo.save(s));
    }

    /** Doctor approves: the narrative is frozen and the summary is locked. */
    @Transactional
    public SummaryResponse approve(Long id, ApproveSummary in) {
        DischargeSummary s = find(id);
        requireNotApproved(s);

        if (in != null && !isBlank(in.sectionsJson())) {
            s.setSectionsJson(in.sectionsJson()); // doctor's corrections / additions
        }
        s.setRenderedJson(renderer.render(s.getSectionsJson()));
        s.setStatus(DischargeStatus.APPROVED);
        s.setApprovedBy(in == null || isBlank(in.approvedBy()) ? s.getDoctor().getDoctorName() : in.approvedBy());
        s.setApprovedAt(LocalDateTime.now());
        return toResponse(repo.save(s));
    }

    @Transactional
    public void delete(Long id) {
        DischargeSummary s = find(id);
        if (s.getStatus() == DischargeStatus.APPROVED) {
            throw err(HttpStatus.CONFLICT, "Approved summaries cannot be deleted");
        }
        repo.delete(s);
    }

    // ------------------------------------------------------------ helpers

    private DischargeSummary find(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> err(HttpStatus.NOT_FOUND, "Discharge summary not found"));
    }

    private void requireNotApproved(DischargeSummary s) {
        if (s.getStatus() == DischargeStatus.APPROVED) {
            throw err(HttpStatus.CONFLICT, "Approved summaries are locked");
        }
    }

    private static boolean isBlank(String v) {
        return v == null || v.isBlank();
    }

    private static String str(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    private PatientInfo toPatient(PatientRegistration p) {
        String fullName = java.util.stream.Stream.of(p.getFirstName(), p.getMiddleName(), p.getLastName())
                .filter(n -> n != null && !n.isBlank())
                .map(String::trim)
                .collect(java.util.stream.Collectors.joining(" "));

        return new PatientInfo(p.getId(), p.getUhid(), fullName, null,
                str(p.getAge()), p.getContact());
    }

    private DoctorInfo toDoctor(AddDoctor d) {
        return new DoctorInfo(d.getId(), d.getDoctorName(), d.getSpecialization(),
                d.getRegistrationNo());
    }

    private SummaryResponse toResponse(DischargeSummary s) {
        DischargeTemplate t = s.getTemplate();
        return new SummaryResponse(
                s.getId(),
                s.getSummaryNo(),
                s.getStatus().name(),
                toPatient(s.getPatient()),
                toDoctor(s.getDoctor()),
                t.getId(),
                t.getName(),
                t.getDocumentTitle(),
                t.getCentreName(),
                t.getCentreAddress(),
                t.getCentrePhone(),
                t.getLogoUrl(),
                t.getLayoutJson(),
                s.getAdmissionDate(),
                s.getDischargeDate(),
                s.getPreparedBy(),
                s.getSectionsJson(),
                s.getRenderedJson(),
                s.getReviewRemark(),
                s.getApprovedBy(),
                s.getApprovedAt(),
                s.getCreatedAt(),
                s.getUpdatedAt());
    }
}
