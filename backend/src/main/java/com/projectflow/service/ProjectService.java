package com.projectflow.service;

import com.projectflow.dto.request.ProjectRequest;
import com.projectflow.dto.response.ApiResponse;
import com.projectflow.entity.User;
import org.springframework.data.domain.Pageable;

public interface ProjectService {
    ApiResponse.ProjectResponse createProject(User user, ProjectRequest.Create request);
    ApiResponse.ProjectResponse getProject(User user, Long projectId);
    ApiResponse.PageResponse<ApiResponse.ProjectResponse> getUserProjects(User user, String search, Pageable pageable);
    ApiResponse.ProjectResponse updateProject(User user, Long projectId, ProjectRequest.Update request);
    void deleteProject(User user, Long projectId);
    ApiResponse.ProjectResponse inviteMember(User user, Long projectId, ProjectRequest.InviteMember request);
    void removeMember(User user, Long projectId, Long memberId);
    ApiResponse.ProjectResponse updateMemberRole(User user, Long projectId, Long memberId, ProjectRequest.UpdateMemberRole request);
}
