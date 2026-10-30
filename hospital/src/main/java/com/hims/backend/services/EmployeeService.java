package com.hims.backend.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hims.backend.entity.Employee;
import com.hims.backend.repository.EmployeeRepository;

@Service
public class EmployeeService {

    private final EmployeeRepository repository;

    public EmployeeService(EmployeeRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Employee create(Employee employee) {
        employee.setId(null);
        if (employee.getRole() == null || employee.getRole().isBlank()) {
            employee.setRole("NURSE");
        }
        return repository.save(employee);
    }

    public List<Employee> getAll() {
        return repository.findAllByOrderByIdAsc();
    }

    public Employee getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
    }

    @Transactional
    public Employee updateRole(Long id, String newRole) {
        Employee employee = getById(id);
        employee.setRole(newRole);
        return repository.save(employee);
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(getById(id));
    }
}
