package com.fieldforce.repository;

import com.fieldforce.model.ComponentUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ComponentUsageLogRepository extends JpaRepository<ComponentUsageLog, Long> {
    List<ComponentUsageLog> findAllByOrderByIdDesc();
    
    @Query("SELECT l FROM ComponentUsageLog l WHERE l.componentId IN (SELECT c.id FROM Component c WHERE c.region = :region) ORDER BY l.id DESC")
    List<ComponentUsageLog> findByRegion(@Param("region") String region);
}
