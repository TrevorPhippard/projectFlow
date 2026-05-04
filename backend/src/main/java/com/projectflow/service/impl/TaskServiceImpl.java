package com.projectflow.service.impl;

import com.projectflow.dto.request.TaskRequest;
import com.projectflow.dto.response.ApiResponse;
import com.projectflow.entity.*;
import com.projectflow.exception.ForbiddenException;
import com.projectflow.exception.ResourceNotFoundException;
import com.projectflow.repository.*;
import com.projectflow.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final TaskCommentRepository commentRepository;

    @Override
    @Transactional
    public ApiResponse.TaskResponse createTask(User user, Long projectId, TaskRequest.Create request) {
        Project project = getProjectWithAccess(user, projectId);

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId()).orElse(null);
        }

        // Find max position in status column
        List<Task> existingTasks = taskRepository.findByProjectIdAndStatusOrderByPosition(
            projectId, request.getStatus() != null ? request.getStatus() : "TODO");
        int position = existingTasks.size() + 1;

        Task task = Task.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .status(request.getStatus() != null ? request.getStatus() : "TODO")
            .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
            .project(project)
            .assignee(assignee)
            .reporter(user)
            .dueDate(request.getDueDate())
            .position(position)
            .storyPoints(request.getStoryPoints())
            .tags(request.getTags() != null ? request.getTags().toArray(new String[0]) : null)
            .build();

        Task saved = taskRepository.save(task);
        logActivity(saved, user, "CREATED", null, null, null);

        return mapToResponse(saved);
    }

    @Override
    public ApiResponse.TaskResponse getTask(User user, Long taskId) {
        Task task = findTaskWithAccess(user, taskId);
        return mapToResponse(task);
    }

    @Override
    public ApiResponse.KanbanBoard getKanbanBoard(User user, Long projectId) {
        getProjectWithAccess(user, projectId);

        List<Task> todo = taskRepository.findByProjectIdAndStatusOrderByPosition(projectId, "TODO");
        List<Task> inProgress = taskRepository.findByProjectIdAndStatusOrderByPosition(projectId, "IN_PROGRESS");
        List<Task> done = taskRepository.findByProjectIdAndStatusOrderByPosition(projectId, "DONE");

        return ApiResponse.KanbanBoard.builder()
            .todo(todo.stream().map(this::mapToResponse).collect(Collectors.toList()))
            .inProgress(inProgress.stream().map(this::mapToResponse).collect(Collectors.toList()))
            .done(done.stream().map(this::mapToResponse).collect(Collectors.toList()))
            .build();
    }

    @Override
    public ApiResponse.PageResponse<ApiResponse.TaskResponse> getTasks(
        User user, Long projectId, String status, String priority, Long assigneeId, String search, Pageable pageable) {
        getProjectWithAccess(user, projectId);

        Page<Task> tasks = taskRepository.findWithFilters(projectId, status, priority, assigneeId, search, pageable);
        return buildPageResponse(tasks.map(this::mapToResponse));
    }

    @Override
    @Transactional
    public ApiResponse.TaskResponse updateTask(User user, Long taskId, TaskRequest.Update request) {
        Task task = findTaskWithAccess(user, taskId);

        String oldStatus = task.getStatus();

        if (StringUtils.hasText(request.getTitle())) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (StringUtils.hasText(request.getStatus())) {
            if (!request.getStatus().equals(oldStatus)) {
                logActivity(task, user, "STATUS_CHANGED", oldStatus, request.getStatus(), "status");
            }
            task.setStatus(request.getStatus());
        }
        if (StringUtils.hasText(request.getPriority())) task.setPriority(request.getPriority());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getStoryPoints() != null) task.setStoryPoints(request.getStoryPoints());
        if (request.getTags() != null) task.setTags(request.getTags().toArray(new String[0]));

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            task.setAssignee(assignee);
        } else if (request.getAssigneeId() == null && request.getTitle() != null) {
            // Only clear assignee if explicitly updating other fields
        }

        return mapToResponse(taskRepository.save(task));
    }

    @Override
    @Transactional
    public ApiResponse.TaskResponse updateTaskPosition(User user, Long taskId, TaskRequest.UpdatePosition request) {
        Task task = findTaskWithAccess(user, taskId);

        String oldStatus = task.getStatus();
        if (StringUtils.hasText(request.getStatus()) && !request.getStatus().equals(oldStatus)) {
            logActivity(task, user, "STATUS_CHANGED", oldStatus, request.getStatus(), "status");
            task.setStatus(request.getStatus());
        }
        if (request.getPosition() != null) {
            task.setPosition(request.getPosition());
        }

        return mapToResponse(taskRepository.save(task));
    }

    @Override
    @Transactional
    public void deleteTask(User user, Long taskId) {
        Task task = findTaskWithAccess(user, taskId);

        boolean isReporter = task.getReporter().getId().equals(user.getId());
        boolean isProjectAdmin = memberRepository.findRoleByProjectIdAndUserId(task.getProject().getId(), user.getId())
            .map(role -> "ADMIN".equals(role) || "OWNER".equals(role))
            .orElse(false);

        if (!isReporter && !isProjectAdmin) {
            throw new ForbiddenException("You can only delete tasks you created");
        }

        taskRepository.delete(task);
    }

    @Override
    public ApiResponse.PageResponse<ApiResponse.TaskResponse> getMyTasks(User user, Pageable pageable) {
        Page<Task> tasks = taskRepository.findByAssigneeId(user.getId(), pageable);
        return buildPageResponse(tasks.map(this::mapToResponse));
    }

    @Override
    @Transactional
    public ApiResponse.TaskCommentResponse addComment(User user, Long taskId, TaskRequest.AddComment request) {
        Task task = findTaskWithAccess(user, taskId);

        TaskComment comment = TaskComment.builder()
            .task(task)
            .author(user)
            .content(request.getContent())
            .build();

        TaskComment saved = commentRepository.save(comment);
        return mapCommentToResponse(saved);
    }

    @Override
    public ApiResponse.PageResponse<ApiResponse.TaskCommentResponse> getComments(Long taskId, Pageable pageable) {
        Page<TaskComment> comments = commentRepository.findByTaskIdOrderByCreatedAtDesc(taskId, pageable);
        return buildPageResponse(comments.map(this::mapCommentToResponse));
    }

    @Override
    @Transactional
    public void deleteComment(User user, Long commentId) {
        TaskComment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new ForbiddenException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    private Task findTaskWithAccess(User user, Long taskId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));

        getProjectWithAccess(user, task.getProject().getId());
        return task;
    }

    private Project getProjectWithAccess(User user, Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        boolean hasAccess = project.getOwner().getId().equals(user.getId()) ||
            memberRepository.existsByProjectIdAndUserId(projectId, user.getId());

        if (!hasAccess) {
            boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin) {
                throw new ForbiddenException("Access denied to this project");
            }
        }

        return project;
    }

    private void logActivity(Task task, User user, String action, String oldVal, String newVal, String field) {
        TaskActivity activity = TaskActivity.builder()
            .task(task)
            .user(user)
            .action(action)
            .oldValue(oldVal)
            .newValue(newVal)
            .fieldChanged(field)
            .build();
        task.getActivities().add(activity);
    }

    private ApiResponse.TaskResponse mapToResponse(Task task) {
        return ApiResponse.TaskResponse.builder()
            .id(task.getId())
            .title(task.getTitle())
            .description(task.getDescription())
            .status(task.getStatus())
            .priority(task.getPriority())
            .projectId(task.getProject().getId())
            .projectKey(task.getProject().getKey())
            .projectName(task.getProject().getName())
            .assignee(task.getAssignee() != null ? mapUserToSummary(task.getAssignee()) : null)
            .reporter(mapUserToSummary(task.getReporter()))
            .dueDate(task.getDueDate())
            .position(task.getPosition())
            .storyPoints(task.getStoryPoints())
            .tags(task.getTags())
            .commentsCount(task.getComments().size())
            .createdAt(task.getCreatedAt())
            .updatedAt(task.getUpdatedAt())
            .build();
    }

    private ApiResponse.TaskCommentResponse mapCommentToResponse(TaskComment comment) {
        return ApiResponse.TaskCommentResponse.builder()
            .id(comment.getId())
            .author(mapUserToSummary(comment.getAuthor()))
            .content(comment.getContent())
            .createdAt(comment.getCreatedAt())
            .updatedAt(comment.getUpdatedAt())
            .build();
    }

    private ApiResponse.UserSummary mapUserToSummary(User user) {
        return ApiResponse.UserSummary.builder()
            .id(user.getId())
            .email(user.getEmail())
            .username(user.getUsername())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarUrl())
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
