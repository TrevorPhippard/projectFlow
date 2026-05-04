package com.projectflow.repository;

import com.projectflow.entity.Project;
import com.projectflow.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    Optional<Project> findByKey(String key);

    boolean existsByKey(String key);

    @Query("""
        SELECT DISTINCT p FROM Project p
        LEFT JOIN p.members m
        WHERE p.owner = :user OR m.user = :user
        """)
    Page<Project> findAllByMemberOrOwner(@Param("user") User user, Pageable pageable);

    @Query("""
        SELECT DISTINCT p FROM Project p
        LEFT JOIN p.members m
        WHERE (p.owner = :user OR m.user = :user)
        AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))
          OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))
        """)
    Page<Project> searchByMemberOrOwner(@Param("user") User user, @Param("query") String query, Pageable pageable);

    @Query("""
        SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
        FROM Project p
        LEFT JOIN p.members m
        WHERE p.id = :projectId AND (p.owner.id = :userId OR m.user.id = :userId)
        """)
    boolean isMember(@Param("projectId") Long projectId, @Param("userId") Long userId);
}
