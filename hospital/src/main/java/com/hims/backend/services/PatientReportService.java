package com.hims.backend.services;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.hims.backend.dto.ReportDtos.ApproveReport;
import com.hims.backend.dto.ReportDtos.CreateReport;
import com.hims.backend.dto.ReportDtos.DoctorInfo;
import com.hims.backend.dto.ReportDtos.ImageInfo;
import com.hims.backend.dto.ReportDtos.PatientInfo;
import com.hims.backend.dto.ReportDtos.PendingTest;
import com.hims.backend.dto.ReportDtos.ReportResponse;
import com.hims.backend.dto.ReportDtos.ReturnToDoctor;
import com.hims.backend.dto.ReportDtos.SendForReview;
import com.hims.backend.dto.ReportDtos.SendToDepartment;
import com.hims.backend.dto.ReportDtos.UpdateReport;
import com.hims.backend.entity.Bill;
import com.hims.backend.entity.BillItem;
import com.hims.backend.entity.Doctor;
import com.hims.backend.entity.Patient;
import com.hims.backend.entity.PatientReport;
import com.hims.backend.entity.ReportImage;
import com.hims.backend.entity.ReportStatus;
import com.hims.backend.repository.BillItemRepository;
import com.hims.backend.repository.DoctorRepository;
import com.hims.backend.repository.MedicalServiceRepository;
import com.hims.backend.repository.PatientReportRepository;
import com.hims.backend.repository.PatientRepository;
import com.hims.backend.repository.ReportImageRepository;
import com.hims.backend.repository.ReportTemplateRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PatientReportService {

    private final PatientReportRepository repo;
    private final ReportTemplateRepository templateRepo;
    private final ReportImageRepository imageRepo;
    private final PatientRepository patientRepo;          // needs findByUhid(String)
    private final DoctorRepository doctorRepo;
    private final MedicalServiceRepository serviceRepo;
    private final BillItemRepository billItemRepo;

    private static ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    // ---------- reports ----------

    @Transactional
    public ReportResponse create(CreateReport q) {
        Patient patient = patientRepo.findByUhid(q.patientUhid())
                .orElseThrow(() -> bad("Patient not found"));

        Doctor referring = (q.referringDoctorId() != null)
                ? doctorRepo.findById(q.referringDoctorId()).orElseThrow(() -> bad("Doctor not found"))
                : patient.getDoctor();                    // default: the patient's own doctor
        if (referring == null) {
			throw bad("Referring doctor is required");
		}

        PatientReport r = new PatientReport();
        r.setPatient(patient);
        r.setReferringDoctor(referring);
        r.setVisitType(q.visitType());
        r.setCategory(q.category());
        r.setTestName(q.testName());
        r.setContentJson(q.contentJson() == null ? "{}" : q.contentJson());
        r.setCreatedBy(q.createdBy());

        if (q.serviceId() != null) {
			r.setMedicalService(serviceRepo.findById(q.serviceId()).orElseThrow(() -> bad("Test not found")));
		}
        if (q.templateId() != null) {
			r.setTemplate(templateRepo.findById(q.templateId()).orElseThrow(() -> bad("Template not found")));
		}
        if (q.billItemId() != null) {
            if (repo.existsByBillItemId(q.billItemId())) {
				throw bad("A report already exists for this test");
			}
            BillItem bi = billItemRepo.findById(q.billItemId()).orElseThrow(() -> bad("Bill item not found"));
            if (!bi.getBill().getPatient().getId().equals(patient.getId())) {
				throw bad("Bill item does not belong to this patient");
			}
            r.setBillItem(bi);
        }

        PatientReport saved = repo.save(r);
        saved.setReportNo(String.format("RPT%05d", saved.getId()));
        return toResponse(repo.save(saved));
    }

    @Transactional
    public ReportResponse update(Long id, UpdateReport q) {
        PatientReport r = load(id);
        if (r.getStatus() == ReportStatus.APPROVED) {
			throw bad("Approved reports cannot be edited");
		}
        if (q.contentJson() != null) {
			r.setContentJson(q.contentJson());
		}
        if (q.testName() != null) {
			r.setTestName(q.testName());
		}
        if (q.visitType() != null) {
			r.setVisitType(q.visitType());
		}
        return toResponse(repo.save(r));
    }

    @Transactional
    public ReportResponse send(Long id, SendForReview q) {
        PatientReport r = load(id);
        if (r.getStatus() == ReportStatus.APPROVED) {
			throw bad("Report is already approved");
		}
        Doctor d = doctorRepo.findById(q.reviewingDoctorId()).orElseThrow(() -> bad("Doctor not found"));
        r.setReviewingDoctor(d);
        r.setStatus(ReportStatus.SENT_FOR_REVIEW);
        return toResponse(repo.save(r));
    }

    @Transactional
    public ReportResponse approve(Long id, ApproveReport q) {
        PatientReport r = load(id);
        if (r.getStatus() != ReportStatus.RETURNED_TO_DOCTOR
                && r.getStatus() != ReportStatus.SENT_FOR_REVIEW
                && r.getStatus() != ReportStatus.DRAFT) {
			throw bad("Report cannot be approved in its current state");
		}
        r.setDoctorComment(q.doctorComment());
        r.setStatus(ReportStatus.APPROVED);
        r.setApprovedAt(LocalDateTime.now());
        return toResponse(repo.save(r));
    }

    @Transactional
    public ReportResponse reopen(Long id) {
        PatientReport r = load(id);
        r.setStatus(ReportStatus.DRAFT);
        r.setApprovedAt(null);
        return toResponse(repo.save(r));
    }

    @Transactional
    public ReportResponse sendToDepartment(Long id, SendToDepartment q) {
        PatientReport r = load(id);
        if (r.getStatus() == ReportStatus.APPROVED) {
			throw bad("Report is already approved");
		}
        String dept = (q.department() == null || q.department().isBlank()) ? r.getCategory() : q.department();
        r.setDepartment(dept);
        r.setStatus(ReportStatus.SENT_TO_DEPARTMENT);
        r.setSentToDeptAt(LocalDateTime.now());
        return toResponse(repo.save(r));
    }

    @Transactional
    public ReportResponse returnToDoctor(Long id, ReturnToDoctor q) {
        PatientReport r = load(id);
        if (r.getStatus() != ReportStatus.SENT_TO_DEPARTMENT) {
			throw bad("Report is not with a department");
		}
        r.setFilledBy(q.filledBy());
        r.setDepartmentRemark(q.departmentRemark());
        r.setStatus(ReportStatus.RETURNED_TO_DOCTOR);
        r.setReturnedAt(LocalDateTime.now());
        return toResponse(repo.save(r));
    }

    @Transactional(readOnly = true)
    public ReportResponse get(Long id) {
        return toResponse(load(id));
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> list(String uhid, Long referringDoctorId, Long reviewingDoctorId,
                                     String status, String department, String category) {
        List<PatientReport> list;
        if (department != null && !department.isBlank()) {
            ReportStatus s = (status == null || status.isBlank())
                    ? ReportStatus.SENT_TO_DEPARTMENT : parseStatus(status);
            list = repo.findByDepartmentAndStatusOrderByUpdatedAtDesc(department, s);
        } else if (uhid != null && !uhid.isBlank() && category != null && !category.isBlank()) {
            list = repo.findByPatientUhidAndCategoryOrderByCreatedAtDesc(uhid, category);
        } else if (uhid != null && !uhid.isBlank()) {
            list = repo.findByPatientUhidOrderByCreatedAtDesc(uhid);
        } else if (reviewingDoctorId != null) {
            ReportStatus s = (status == null || status.isBlank())
                    ? ReportStatus.SENT_FOR_REVIEW : parseStatus(status);
            list = repo.findByReviewingDoctorIdAndStatusOrderByUpdatedAtDesc(reviewingDoctorId, s);
        } else if (referringDoctorId != null) {
            list = repo.findByReferringDoctorIdOrderByCreatedAtDesc(referringDoctorId);
        } else if (category != null && !category.isBlank()) {
            list = repo.findByCategoryOrderByCreatedAtDesc(category);
        } else if (status != null && !status.isBlank()) {
            list = repo.findByStatusOrderByUpdatedAtDesc(parseStatus(status));
        } else {
            list = repo.findAllByOrderByCreatedAtDesc();
        }
        return list.stream().map(this::toResponse).toList();
    }

    private static ReportStatus parseStatus(String s) {
        try { return ReportStatus.valueOf(s); }
        catch (IllegalArgumentException e) { throw bad("Invalid status: " + s); }
    }

    @Transactional(readOnly = true)
    public List<PendingTest> pendingTests(List<String> categories) {
        return repo.findPendingTests(categories).stream().map(bi -> {
            Bill b = bi.getBill();
            Patient p = b.getPatient();
            Doctor d = b.getDoctor();
            return new PendingTest(bi.getId(), b.getBillNo(), p.getUhid(), fullName(p),
                    d == null ? null : d.getId(),
                    d == null ? null : d.getDname(),
                    bi.getServiceName(), bi.getCategory());
        }).toList();
    }

    // ---------- images ----------

    @Transactional
    public ImageInfo addImage(Long reportId, MultipartFile file, String caption) throws IOException {
        PatientReport r = load(reportId);
        if (r.getStatus() == ReportStatus.APPROVED) {
			throw bad("Approved reports cannot be edited");
		}
        if (file.isEmpty()) {
			throw bad("Empty file");
		}
        String ct = file.getContentType();
        if (ct == null || !ct.startsWith("image/")) {
			throw bad("Only image files are allowed");
		}
        ReportImage img = new ReportImage();
        img.setReport(r);
        img.setFileName(file.getOriginalFilename());
        img.setContentType(ct);
        img.setCaption(caption);
        img.setData(file.getBytes());
        return toImage(imageRepo.save(img));
    }

    @Transactional(readOnly = true)
    public ReportImage getImage(Long imageId) {
        ReportImage img = imageRepo.findById(imageId).orElseThrow(() -> bad("Image not found"));
        img.getData();                                    // force load inside the transaction
        return img;
    }

    @Transactional
    public void deleteImage(Long imageId) {
        ReportImage img = imageRepo.findById(imageId).orElseThrow(() -> bad("Image not found"));
        if (img.getReport().getStatus() == ReportStatus.APPROVED) {
			throw bad("Approved reports cannot be edited");
		}
        imageRepo.delete(img);
    }

    // ---------- helpers ----------

    private PatientReport load(Long id) {
        return repo.findWithRelationsById(id).orElseThrow(() -> bad("Report not found"));
    }

    private static String fullName(Patient p) {
        return Stream.of(p.getFirstName(), p.getMiddleName(), p.getLastName())
                .filter(s -> s != null && !s.isBlank()).collect(Collectors.joining(" "));
    }

    private DoctorInfo toDoctor(Doctor d) {
        if (d == null) {
			return null;
		}
        return new DoctorInfo(d.getId(), d.getDname(), d.getQualification(), d.getRegistrationNo());
    }

    private PatientInfo toPatient(Patient p) {
        // TODO: add gender / age / phone getters from your Patient entity if you want them in the header
        return new PatientInfo(p.getId(), p.getUhid(), fullName(p), null, null, null);
    }

    private ImageInfo toImage(ReportImage i) {
        return new ImageInfo(i.getId(), i.getFileName(), i.getContentType(), i.getCaption());
    }

    private ReportResponse toResponse(PatientReport r) {
        List<ImageInfo> images = imageRepo.findByReportId(r.getId()).stream().map(this::toImage).toList();
        return new ReportResponse(
                r.getId(), r.getReportNo(), r.getStatus().name(), r.getCategory(), r.getTestName(),
                r.getMedicalService() == null ? null : r.getMedicalService().getId(),
                r.getVisitType(),
                r.getTemplate() == null ? null : r.getTemplate().getId(),
                r.getTemplate() == null ? null : r.getTemplate().getSectionsJson(),
                toPatient(r.getPatient()), toDoctor(r.getReferringDoctor()), toDoctor(r.getReviewingDoctor()),
                r.getContentJson(), r.getDoctorComment(), r.getCreatedBy(),
                r.getApprovedAt(), r.getCreatedAt(), r.getUpdatedAt(), images,
                r.getDepartment(), r.getDepartmentRemark(), r.getFilledBy());
    }
}