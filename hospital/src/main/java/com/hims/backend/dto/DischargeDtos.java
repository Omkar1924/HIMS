package com.hims.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DischargeDtos {

	public record CreateSummary(Long templateId, String patientUhid, Long doctorId, LocalDate admissionDate,
			LocalDate dischargeDate, String preparedBy, String sectionsJson) {
	}

	public record UpdateSummary(LocalDate admissionDate, LocalDate dischargeDate, String preparedBy,
			String sectionsJson) {
	}

	public record ApproveSummary(String approvedBy, String sectionsJson) {
	}

	public record ReturnToNurse(String remark) {
	}

	public record SummaryResponse(Long id, String summaryNo, String status, ReportDtos.PatientInfo patient,
			ReportDtos.DoctorInfo doctor, Long templateId, String templateName, String documentTitle,
			String centreName, String centreAddress, String centrePhone, String logoUrl, String layoutJson,
			LocalDate admissionDate, LocalDate dischargeDate, String preparedBy, String sectionsJson,
			String renderedJson, String reviewRemark, String approvedBy, LocalDateTime approvedAt,
			LocalDateTime createdAt, LocalDateTime updatedAt) {
	}

	public record SpellRequest(String text) {
	}

	public record SpellChange(String original, String corrected, int start) {
	}

	public record SpellResult(String corrected, List<SpellChange> changes) {
	}
}