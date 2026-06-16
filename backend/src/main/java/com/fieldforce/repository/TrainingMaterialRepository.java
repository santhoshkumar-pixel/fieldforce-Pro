package com.fieldforce.repository;

import com.fieldforce.model.TrainingMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingMaterialRepository extends JpaRepository<TrainingMaterial, String> {
    List<TrainingMaterial> findByTargetedRoleOrTargetedRole(String role1, String role2);
}
