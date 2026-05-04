package com.projectflow.service;

import com.projectflow.dto.request.UserRequest;
import com.projectflow.dto.response.ApiResponse;
import com.projectflow.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    ApiResponse.UserProfile getCurrentUser(User user);
    ApiResponse.UserProfile updateProfile(User user, UserRequest.UpdateProfile request);
    ApiResponse.UserProfile updateAvatar(User user, MultipartFile file);
    void changePassword(User user, UserRequest.ChangePassword request);
    ApiResponse.PageResponse<ApiResponse.UserSummary> searchUsers(String query, Pageable pageable);
    ApiResponse.UserProfile getUserById(Long id);
}
