package com.projectflow.service;

import com.projectflow.dto.request.ProjectRequest;
import com.projectflow.dto.response.ApiResponse;
import com.projectflow.entity.Project;
import com.projectflow.entity.ProjectMember;
import com.projectflow.entity.Role;
import com.projectflow.entity.User;
import com.projectflow.exception.BadRequestException;
import com.projectflow.exception.ForbiddenException;
import com.projectflow.repository.ProjectMemberRepository;
import com.projectflow.repository.ProjectRepository;
import com.projectflow.repository.TaskRepository;
import com.projectflow.repository.UserRepository;
import com.projectflow.service.impl.ProjectServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock ProjectRepository projectRepository;
    @Mock ProjectMemberRepository memberRepository;
    @Mock UserRepository userRepository;
    @Mock TaskRepository taskRepository;

    @InjectMocks ProjectServiceImpl projectService;

    private User owner;
    private Project project;

    @BeforeEach
    void setUp() {
        Role role = Role.builder().id(1L).name("ROLE_USER").build();
        owner = User.builder().id(1L).email("owner@test.com").username("owner")
            .roles(new HashSet<>(Set.of(role))).build();

        project = Project.builder()
            .id(1L).name("Test Project").key("TST").color("#6366f1")
            .owner(owner).members(new ArrayList<>()).tasks(new ArrayList<>())
            .build();
    }

    @Test
    void createProject_Success() {
        ProjectRequest.Create req = new ProjectRequest.Create();
        req.setName("New Project");
        req.setKey("NEW");
        req.setDescription("Description");
        req.setColor("#6366f1");

        when(projectRepository.existsByKey("NEW")).thenReturn(false);
        when(projectRepository.save(any())).thenReturn(project);
        when(memberRepository.save(any())).thenReturn(new ProjectMember());
        when(taskRepository.findByProjectId(any(), any())).thenReturn(new PageImpl<>(List.of()));

        ApiResponse.ProjectResponse result = projectService.createProject(owner, req);

        assertThat(result).isNotNull();
        verify(projectRepository).save(any(Project.class));
        verify(memberRepository).save(any(ProjectMember.class));
    }

    @Test
    void createProject_DuplicateKey_ThrowsBadRequest() {
        ProjectRequest.Create req = new ProjectRequest.Create();
        req.setName("Test");
        req.setKey("TST");

        when(projectRepository.existsByKey("TST")).thenReturn(true);

        assertThatThrownBy(() -> projectService.createProject(owner, req))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("key");
    }

    @Test
    void deleteProject_NotOwner_ThrowsForbidden() {
        User otherUser = User.builder().id(2L).email("other@test.com")
            .username("other").roles(new HashSet<>()).build();

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(memberRepository.existsByProjectIdAndUserId(1L, 2L)).thenReturn(true);

        assertThatThrownBy(() -> projectService.deleteProject(otherUser, 1L))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void deleteProject_Owner_Success() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(memberRepository.existsByProjectIdAndUserId(1L, 1L)).thenReturn(true);

        projectService.deleteProject(owner, 1L);

        verify(projectRepository).delete(project);
    }
}
