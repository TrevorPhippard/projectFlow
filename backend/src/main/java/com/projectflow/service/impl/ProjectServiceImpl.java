package com.projectflow.service.impl;

import com.projectflow.dto.request.ProjectRequest;
import com.projectflow.dto.response.ApiResponse;
import com.projectflow.entity.Project;
import com.projectflow.entity.ProjectMember;
import com.projectflow.entity.Role;
import com.projectflow.entity.User;
import com.projectflow.exception.BadRequestException;
import com.projectflow.exception.ForbiddenException;
import com.projectflow.exception.ResourceNotFoundException;
import com.projectflow.repository.ProjectMemberRepository;
import com.projectflow.repository.ProjectRepository;
import com.projectflow.repository.TaskRepository;
import com.projectflow.repository.UserRepository;
import com.projectflow.service.ProjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    @Override
    @Transactional
    public ApiResponse.ProjectResponse createProject(User user, ProjectRequest.Create request) {
        if (projectRepository.existsByKey(request.getKey())) {
            throw new BadRequestException("Project key already exists");
        }

        Project project = Project.builder()
            .name(request.getName())
            .description(request.getDescription())
            .key(request.getKey().toUpperCase())
            .color(request.getColor() != null ? request.getColor() : "#6366f1")
            .owner(user)
            .build();

        Project saved = projectRepository.save(project);

        // Add creator as admin member
        ProjectMember member = ProjectMember.builder()
            .project(saved)
            .user(user)
            .role("ADMIN")
            .build();
        memberRepository.save(member);

        log.info("Project created: {} by user: {}", saved.getKey(), user.getEmail());
        return mapToResponse(saved);
    }

    @Override
    public ApiResponse.ProjectResponse getProject(User user, Long projectId) {
        Project project = findProjectWithAccess(user, projectId);
        return mapToResponse(project);
    }

    @Override
    public ApiResponse.PageResponse<ApiResponse.ProjectResponse> getUserProjects(User user, String search, Pageable pageable) {
        Page<Project> projects = StringUtils.hasText(search)
            ? projectRepository.searchByMemberOrOwner(user, search, pageable)
            : projectRepository.findAllByMemberOrOwner(user, pageable);

        Page<ApiResponse.ProjectResponse> mapped = projects.map(this::mapToResponse);
        return buildPageResponse(mapped);
    }

    @Override
    @Transactional
    public ApiResponse.ProjectResponse updateProject(User user, Long projectId, ProjectRequest.Update request) {
        Project project = findProjectWithAccess(user, projectId);
        requireAdminRole(user, project);

        if (StringUtils.hasText(request.getName())) project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (StringUtils.hasText(request.getColor())) project.setColor(request.getColor());
        if (StringUtils.hasText(request.getStatus())) project.setStatus(request.getStatus());

        return mapToResponse(projectRepository.save(project));
    }

    @Override
    @Transactional
    public void deleteProject(User user, Long projectId) {
        Project project = findProjectWithAccess(user, projectId);
        if (!project.getOwner().getId().equals(user.getId())) {
            throw new ForbiddenException("Only the project owner can delete the project");
        }
        projectRepository.delete(project);
        log.info("Project deleted: {} by user: {}", project.getKey(), user.getEmail());
    }

    @Override
    @Transactional
    public ApiResponse.ProjectResponse inviteMember(User user, Long projectId, ProjectRequest.InviteMember request) {
        Project project = findProjectWithAccess(user, projectId);
        requireAdminRole(user, project);

        User invitee = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        if (memberRepository.existsByProjectIdAndUserId(projectId, invitee.getId())) {
            throw new BadRequestException("User is already a member of this project");
        }

        ProjectMember member = ProjectMember.builder()
            .project(project)
            .user(invitee)
            .role(request.getRole() != null ? request.getRole() : "MEMBER")
            .build();
        memberRepository.save(member);

        return mapToResponse(projectRepository.findById(projectId).orElseThrow());
    }

    @Override
    @Transactional
    public void removeMember(User user, Long projectId, Long memberId) {
        Project project = findProjectWithAccess(user, projectId);
        requireAdminRole(user, project);

        ProjectMember member = memberRepository.findById(memberId)
            .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        if (member.getUser().getId().equals(project.getOwner().getId())) {
            throw new BadRequestException("Cannot remove the project owner");
        }

        memberRepository.delete(member);
    }

    @Override
    @Transactional
    public ApiResponse.ProjectResponse updateMemberRole(User user, Long projectId, Long memberId, ProjectRequest.UpdateMemberRole request) {
        Project project = findProjectWithAccess(user, projectId);
        requireAdminRole(user, project);

        ProjectMember member = memberRepository.findById(memberId)
            .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        member.setRole(request.getRole());
        memberRepository.save(member);

        return mapToResponse(projectRepository.findById(projectId).orElseThrow());
    }

    private Project findProjectWithAccess(User user, Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        boolean hasAccess = project.getOwner().getId().equals(user.getId()) ||
            memberRepository.existsByProjectIdAndUserId(projectId, user.getId());

        if (!hasAccess) {
            // Check if admin
            boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin) {
                throw new ForbiddenException("Access denied to this project");
            }
        }

        return project;
    }

    private void requireAdminRole(User user, Project project) {
        if (project.getOwner().getId().equals(user.getId())) return;

        String role = memberRepository.findRoleByProjectIdAndUserId(project.getId(), user.getId())
            .orElse("MEMBER");

        if (!"ADMIN".equals(role)) {
            throw new ForbiddenException("Admin role required for this action");
        }
    }

    private ApiResponse.ProjectResponse mapToResponse(Project project) {
        long taskCount = taskRepository.findByProjectId(project.getId(), Pageable.unpaged()).getTotalElements();

        List<ApiResponse.ProjectMemberResponse> memberResponses = project.getMembers().stream()
            .map(m -> ApiResponse.ProjectMemberResponse.builder()
                .id(m.getId())
                .user(mapUserToSummary(m.getUser()))
                .role(m.getRole())
                .joinedAt(m.getJoinedAt())
                .build())
            .collect(Collectors.toList());

        return ApiResponse.ProjectResponse.builder()
            .id(project.getId())
            .name(project.getName())
            .description(project.getDescription())
            .key(project.getKey())
            .status(project.getStatus())
            .color(project.getColor())
            .owner(mapUserToSummary(project.getOwner()))
            .members(memberResponses)
            .taskCount(taskCount)
            .createdAt(project.getCreatedAt())
            .updatedAt(project.getUpdatedAt())
            .build();
    }

    private ApiResponse.UserSummary mapUserToSummary(User user) {
        return ApiResponse.UserSummary.builder()
            .id(user.getId())
            .email(user.getEmail())
            .username(user.getUsername())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarUrl())
            .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
            .build();
    }

    private <T> ApiResponse.PageResponse<T> buildPageResponse(Page<T> page) {
        return ApiResponse.PageResponse.<T>builder()
            .content(page.getContent())
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .first(page.isFirst())
            .last(page.isLast())
            .build();
    }
}
