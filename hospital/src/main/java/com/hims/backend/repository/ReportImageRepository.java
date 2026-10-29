package com.hims.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hims.backend.entity.ReportImage;

public interface ReportImageRepository extends JpaRepository<ReportImage, Long> {

    @Query("select i from ReportImage i where i.report.id = :reportId order by i.id")
    List<ReportImage> findByReportId(@Param("reportId") Long reportId);
}