package com.projectflow.service;

import com.projectflow.dto.request.TaskRequest;
import com.projectflow.dto.response.ApiResponse;
import com.projectflow.entity.User;
import org.springframework.data.domain.Pageable;

public interface TaskService {
    ApiResponse.TaskResponse createTask(User user, Long projectId, TaskRequest.Create request);
    ApiResponse.TaskResponse getTask(User user, Long taskId);
    ApiResponse.KanbanBoard getKanbanBoard(User user, Long projectId);
    ApiResponse.PageResponse<ApiResponse.TaskResponse> getTasks(User user, Long projectId, String status, String priority, Long assigneeId, String search, Pageable pageable);
    ApiResponse.TaskResponse updateTask(User user, Long taskId, TaskRequest.Update request);
    ApiResponse.TaskResponse updateTaskPosition(User user, Long taskId, TaskRequest.UpdatePosition request);
    void deleteTask(User user, Long taskId);
    ApiResponse.PageResponse<ApiResponse.TaskResponse> getMyTasks(User user, Pageable pageable);
    ApiResponse.TaskCommentResponse addComment(User user, Long taskId, TaskRequest.AddComment request);
    ApiResponse.PageResponse<ApiResponse.TaskCommentResponse> getComments(Long taskId, Pageable pageable);
    void deleteComment(User user, Long commentId);
}
