package com.fieldforce.repository;

import com.fieldforce.model.UserLocationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface UserLocationHistoryRepository extends JpaRepository<UserLocationHistory, Long> {
    List<UserLocationHistory> findByUserIdOrderByTimestampAsc(String userId);
    List<UserLocationHistory> findTop50ByUserIdOrderByTimestampDesc(String userId);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM user_location_history WHERE user_id = :userId AND id NOT IN (SELECT id FROM (SELECT id FROM user_location_history WHERE user_id = :userId ORDER BY timestamp DESC LIMIT 50) AS temp)", nativeQuery = true)
    void pruneOldLocations(@Param("userId") String userId);
}
