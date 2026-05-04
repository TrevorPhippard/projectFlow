package com.projectflow.service;

import com.projectflow.dto.request.TaskRequest;
import com.projectflow.dto.response.ApiResponse;
import com.projectflow.entity.*;
import com.projectflow.exception.ForbiddenException;
import com.projectflow.exception.ResourceNotFoundException;
import com.projectflow.repository.*;
import com.projectflow.service.impl.TaskServiceImpl;
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
class TaskServiceTest {

    @Mock TaskRepository taskRepository;
    @Mock ProjectRepository projectRepository;
    @Mock ProjectMemberRepository memberRepository;
    @Mock UserRepository userRepository;
    @Mock TaskCommentRepository commentRepository;

    @InjectMocks TaskServiceImpl taskService;

    private User reporter;
    private User assignee;
    private Project project;
    private Task task;

    @BeforeEach
    void setUp() {
        Role role = Role.builder().id(1L).name("ROLE_USER").build();
        reporter = User.builder().id(1L).email("reporter@test.com").username("reporter")
            .roles(new HashSet<>(Set.of(role))).build();
        assignee = User.builder().id(2L).email("assignee@test.com").username("assignee")
            .roles(new HashSet<>(Set.of(role))).build();

        project = Project.builder()
            .id(1L).name("Test Project").key("TST").color("#6366f1")
            .owner(reporter).members(new ArrayList<>()).tasks(new ArrayList<>())
            .build();

        task = Task.builder()
            .id(1L).title("Test Task").status("TODO").priority("MEDIUM")
            .project(project).reporter(reporter)
            .comments(new ArrayList<>()).activities(new ArrayList<>())
            .position(1).build();
    }

    @Test
    void createTask_Success() {
        TaskRequest.Create req = new TaskRequest.Create();
        req.setTitle("New Task");
        req.setStatus("TODO");
        req.setPriority("HIGH");

        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(memberRepository.existsByProjectIdAndUserId(1L, 1L)).thenReturn(true);
        when(taskRepository.findByProjectIdAndStatusOrderByPosition(1L, "TODO")).thenReturn(List.of());
        when(taskRepository.save(any())).thenReturn(task);

        ApiResponse.TaskResponse result = taskService.createTask(reporter, 1L, req);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Test Task");
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void getTask_ProjectMember_Success() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(memberRepository.existsByProjectIdAndUserId(1L, 1L)).thenReturn(true);

        ApiResponse.TaskResponse result = taskService.getTask(reporter, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void getTask_NonMember_ThrowsForbidden() {
        User stranger = User.builder().id(99L).email("x@x.com").username("x")
            .roles(new HashSet<>()).build();

        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(memberRepository.existsByProjectIdAndUserId(1L, 99L)).thenReturn(false);

        assertThatThrownBy(() -> taskService.getTask(stranger, 1L))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void getTask_NotFound_ThrowsResourceNotFound() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTask(reporter, 99L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteTask_Reporter_Success() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(memberRepository.existsByProjectIdAndUserId(1L, 1L)).thenReturn(true);
        when(memberRepository.findRoleByProjectIdAndUserId(1L, 1L)).thenReturn(Optional.of("MEMBER"));

        taskService.deleteTask(reporter, 1L);

        verify(taskRepository).delete(task);
    }

    @Test
    void getKanbanBoard_ReturnsBoardData() {
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        when(memberRepository.existsByProjectIdAndUserId(1L, 1L)).thenReturn(true);
        when(taskRepository.findByProjectIdAndStatusOrderByPosition(1L, "TODO")).thenReturn(List.of(task));
        when(taskRepository.findByProjectIdAndStatusOrderByPosition(1L, "IN_PROGRESS")).thenReturn(List.of());
        when(taskRepository.findByProjectIdAndStatusOrderByPosition(1L, "DONE")).thenReturn(List.of());

        ApiResponse.KanbanBoard board = taskService.getKanbanBoard(reporter, 1L);

        assertThat(board.getTodo()).hasSize(1);
        assertThat(board.getInProgress()).isEmpty();
        assertThat(board.getDone()).isEmpty();
    }
}
