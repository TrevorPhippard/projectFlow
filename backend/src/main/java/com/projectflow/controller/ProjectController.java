package com.projectflow.controller;

import com.projectflow.dto.request.ProjectRequest;
import com.projectflow.dto.response.ApiResponse;
import com.projectflow.entity.User;
import com.projectflow.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project management APIs")
@SecurityRequirement(name = "bearerAuth")
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @Operation(summary = "Create a new project")
    public ResponseEntity<ApiResponse.ProjectResponse> createProject(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody ProjectRequest.Create request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(projectService.createProject(user, request));
    }

    @GetMapping
    @Operation(summary = "Get all user projects")
    public ResponseEntity<ApiResponse.PageResponse<ApiResponse.ProjectResponse>> getProjects(
        @AuthenticationPrincipal User user,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = "asc".equalsIgnoreCase(sortDir) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(projectService.getUserProjects(user, search, PageRequest.of(page, size, sort)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID")
    public ResponseEntity<ApiResponse.ProjectResponse> getProject(
        @AuthenticationPrincipal User user,
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(projectService.getProject(user, id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update project")
    public ResponseEntity<ApiResponse.ProjectResponse> updateProject(
        @AuthenticationPrincipal User user,
        @PathVariable Long id,
        @Valid @RequestBody ProjectRequest.Update request
    ) {
        return ResponseEntity.ok(projectService.updateProject(user, id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete project")
    public ResponseEntity<Void> deleteProject(
        @AuthenticationPrincipal User user,
        @PathVariable Long id
    ) {
        projectService.deleteProject(user, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    @Operation(summary = "Invite a member to project")
    public ResponseEntity<ApiResponse.ProjectResponse> inviteMember(
        @AuthenticationPrincipal User user,
        @PathVariable Long id,
        @Valid @RequestBody ProjectRequest.InviteMember request
    ) {
        return ResponseEntity.ok(projectService.inviteMember(user, id, request));
    }

    @DeleteMapping("/{id}/members/{memberId}")
    @Operation(summary = "Remove a member from project")
    public ResponseEntity<Void> removeMember(
        @AuthenticationPrincipal User user,
        @PathVariable Long id,
        @PathVariable Long memberId
    ) {
        projectService.removeMember(user, id, memberId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/members/{memberId}/role")
    @Operation(summary = "Update member role")
    public ResponseEntity<ApiResponse.ProjectResponse> updateMemberRole(
        @AuthenticationPrincipal User user,
        @PathVariable Long id,
        @PathVariable Long memberId,
        @Valid @RequestBody ProjectRequest.UpdateMemberRole request
    ) {
        return ResponseEntity.ok(projectService.updateMemberRole(user, id, memberId, request));
    }
}
