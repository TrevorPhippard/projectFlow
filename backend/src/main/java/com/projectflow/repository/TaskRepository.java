package com.projectflow.repository;

import com.projectflow.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    List<Task> findByProjectIdAndStatusOrderByPosition(Long projectId, String status);

    Page<Task> findByProjectId(Long projectId, Pageable pageable);

    Page<Task> findByAssigneeId(Long assigneeId, Pageable pageable);

    @Query("""
        SELECT t FROM Task t
        WHERE t.project.id = :projectId
        AND (:status IS NULL OR t.status = :status)
        AND (:priority IS NULL OR t.priority = :priority)
        AND (:assigneeId IS NULL OR t.assignee.id = :assigneeId)
        AND (:search IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')))
        """)
    Page<Task> findWithFilters(
        @Param("projectId") Long projectId,
        @Param("status") String status,
        @Param("priority") String priority,
        @Param("assigneeId") Long assigneeId,
        @Param("search") String search,
        Pageable pageable
    );

    @Modifying
    @Query("UPDATE Task t SET t.position = :position WHERE t.id = :taskId")
    void updatePosition(@Param("taskId") Long taskId, @Param("position") Integer position);

    @Modifying
    @Query("UPDATE Task t SET t.status = :status, t.position = :position WHERE t.id = :taskId")
    void updateStatusAndPosition(@Param("taskId") Long taskId, @Param("status") String status, @Param("position") Integer position);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.project.id = :projectId AND t.status = :status")
    long countByProjectIdAndStatus(@Param("projectId") Long projectId, @Param("status") String status);
}
