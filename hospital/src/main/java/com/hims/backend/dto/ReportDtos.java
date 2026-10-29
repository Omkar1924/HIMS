package com.hims.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ReportDtos {

	public record CreateReport(Long templateId, String category, String testName, Long serviceId, String patientUhid,
			String visitType, Long referringDoctorId, Long billItemId, String contentJson, String createdBy) {
	}

	public record UpdateReport(String contentJson, String testName, String visitType) {
	}

	public record SendForReview(Long reviewingDoctorId) {
	}

	public record ApproveReport(String doctorComment) {
	}

	public record PendingTest(Long billItemId, String billNo, String uhid, String patientName, Long doctorId,
			String doctorName, String testName, String category) {
	}

	public record DoctorInfo(Long id, String name, String qualification, String registrationNo) {
	}

	public record PatientInfo(Long id, String uhid, String name, String gender, String age, String phone) {
	}

	public record ImageInfo(Long id, String fileName, String contentType, String caption) {
	}

	public record ReportResponse(Long id, String reportNo, String status, String category, String testName,
			Long serviceId, String visitType, Long templateId, String templateStructure, PatientInfo patient,
			DoctorInfo referringDoctor, DoctorInfo reviewingDoctor, String contentJson, String doctorComment,
			String createdBy, LocalDateTime approvedAt, LocalDateTime createdAt, LocalDateTime updatedAt,
			List<ImageInfo> images, String department, String departmentRemark, String filledBy) {
	}

	public record SendToDepartment(String department) {
	}

	public record ReturnToDoctor(String filledBy, String departmentRemark) {
	}
}