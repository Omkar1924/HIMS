package com.hims.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.hims.backend.entity.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    @Query("select e from Employee e order by e.id asc")
    List<Employee> findAllByOrderByIdAsc();

}
