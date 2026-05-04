package com.projectflow.controller;

import com.projectflow.dto.request.TaskRequest;
import com.projectflow.dto.response.ApiResponse;
import com.projectflow.entity.User;
import com.projectflow.service.TaskService;
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
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Task management APIs")
@SecurityRequirement(name = "bearerAuth")
public class TaskController {

    private final TaskService taskService;

    @PostMapping("/projects/{projectId}/tasks")
    @Operation(summary = "Create a task")
    public ResponseEntity<ApiResponse.TaskResponse> createTask(
        @AuthenticationPrincipal User user,
        @PathVariable Long projectId,
        @Valid @RequestBody TaskRequest.Create request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(taskService.createTask(user, projectId, request));
    }

    @GetMapping("/projects/{projectId}/tasks")
    @Operation(summary = "Get tasks for a project with filters")
    public ResponseEntity<ApiResponse.PageResponse<ApiResponse.TaskResponse>> getTasks(
        @AuthenticationPrincipal User user,
        @PathVariable Long projectId,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String priority,
        @RequestParam(required = false) Long assigneeId,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "position") String sortBy,
        @RequestParam(defaultValue = "asc") String sortDir
    ) {
        Sort sort = "desc".equalsIgnoreCase(sortDir) ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        return ResponseEntity.ok(taskService.getTasks(user, projectId, status, priority, assigneeId, search,
            PageRequest.of(page, size, sort)));
    }

    @GetMapping("/projects/{projectId}/board")
    @Operation(summary = "Get kanban board for a project")
    public ResponseEntity<ApiResponse.KanbanBoard> getBoard(
        @AuthenticationPrincipal User user,
        @PathVariable Long projectId
    ) {
        return ResponseEntity.ok(taskService.getKanbanBoard(user, projectId));
    }

    @GetMapping("/tasks/{id}")
    @Operation(summary = "Get task by ID")
    public ResponseEntity<ApiResponse.TaskResponse> getTask(
        @AuthenticationPrincipal User user,
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(taskService.getTask(user, id));
    }

    @PutMapping("/tasks/{id}")
    @Operation(summary = "Update task")
    public ResponseEntity<ApiResponse.TaskResponse> updateTask(
        @AuthenticationPrincipal User user,
        @PathVariable Long id,
        @Valid @RequestBody TaskRequest.Update request
    ) {
        return ResponseEntity.ok(taskService.updateTask(user, id, request));
    }

    @PatchMapping("/tasks/{id}/position")
    @Operation(summary = "Update task status/position (drag and drop)")
    public ResponseEntity<ApiResponse.TaskResponse> updatePosition(
        @AuthenticationPrincipal User user,
        @PathVariable Long id,
        @RequestBody TaskRequest.UpdatePosition request
    ) {
        return ResponseEntity.ok(taskService.updateTaskPosition(user, id, request));
    }

    @DeleteMapping("/tasks/{id}")
    @Operation(summary = "Delete task")
    public ResponseEntity<Void> deleteTask(
        @AuthenticationPrincipal User user,
        @PathVariable Long id
    ) {
        taskService.deleteTask(user, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tasks/my")
    @Operation(summary = "Get tasks assigned to current user")
    public ResponseEntity<ApiResponse.PageResponse<ApiResponse.TaskResponse>> getMyTasks(
        @AuthenticationPrincipal User user,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(taskService.getMyTasks(user, PageRequest.of(page, size, Sort.by("dueDate").ascending())));
    }

    @PostMapping("/tasks/{id}/comments")
    @Operation(summary = "Add comment to task")
    public ResponseEntity<ApiResponse.TaskCommentResponse> addComment(
        @AuthenticationPrincipal User user,
        @PathVariable Long id,
        @Valid @RequestBody TaskRequest.AddComment request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(taskService.addComment(user, id, request));
    }

    @GetMapping("/tasks/{id}/comments")
    @Operation(summary = "Get task comments")
    public ResponseEntity<ApiResponse.PageResponse<ApiResponse.TaskCommentResponse>> getComments(
        @PathVariable Long id,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(taskService.getComments(id, PageRequest.of(page, size)));
    }

    @DeleteMapping("/comments/{id}")
    @Operation(summary = "Delete comment")
    public ResponseEntity<Void> deleteComment(
        @AuthenticationPrincipal User user,
        @PathVariable Long id
    ) {
        taskService.deleteComment(user, id);
        return ResponseEntity.noContent().build();
    }
}
