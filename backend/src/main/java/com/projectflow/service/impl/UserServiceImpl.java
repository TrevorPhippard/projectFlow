package com.projectflow.service.impl;

import com.projectflow.dto.request.UserRequest;
import com.projectflow.dto.response.ApiResponse;
import com.projectflow.entity.Role;
import com.projectflow.entity.User;
import com.projectflow.exception.BadRequestException;
import com.projectflow.exception.ResourceNotFoundException;
import com.projectflow.repository.UserRepository;
import com.projectflow.service.FileStorageService;
import com.projectflow.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    @Override
    public ApiResponse.UserProfile getCurrentUser(User user) {
        return mapToProfile(user);
    }

    @Override
    @Transactional
    public ApiResponse.UserProfile updateProfile(User user, UserRequest.UpdateProfile request) {
        if (StringUtils.hasText(request.getFullName())) {
            user.setFullName(request.getFullName());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        User updated = userRepository.save(user);
        return mapToProfile(updated);
    }

    @Override
    @Transactional
    public ApiResponse.UserProfile updateAvatar(User user, MultipartFile file) {
        String avatarUrl = fileStorageService.storeAvatar(file, user.getId());

        // Delete old avatar if exists
        if (StringUtils.hasText(user.getAvatarUrl())) {
            fileStorageService.deleteFile(user.getAvatarUrl());
        }

        user.setAvatarUrl(avatarUrl);
        User updated = userRepository.save(user);
        return mapToProfile(updated);
    }

    @Override
    @Transactional
    public void changePassword(User user, UserRequest.ChangePassword request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public ApiResponse.PageResponse<ApiResponse.UserSummary> searchUsers(String query, Pageable pageable) {
        Page<User> users = userRepository.searchUsers(query, pageable);
        return buildPageResponse(users.map(this::mapToSummary));
    }

    @Override
    public ApiResponse.UserProfile getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToProfile(user);
    }

    private ApiResponse.UserProfile mapToProfile(User user) {
        return ApiResponse.UserProfile.builder()
            .id(user.getId())
            .email(user.getEmail())
            .username(user.getUsername())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarUrl())
            .bio(user.getBio())
            .provider(user.getProvider())
            .emailVerified(user.getEmailVerified())
            .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }

    private ApiResponse.UserSummary mapToSummary(User user) {
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
