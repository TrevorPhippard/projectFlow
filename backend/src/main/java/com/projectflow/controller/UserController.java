package com.projectflow.controller;

import com.projectflow.dto.request.UserRequest;
import com.projectflow.dto.response.ApiResponse;
import com.projectflow.entity.User;
import com.projectflow.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management APIs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse.UserProfile> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.getCurrentUser(user));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse.UserProfile> updateProfile(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody UserRequest.UpdateProfile request
    ) {
        return ResponseEntity.ok(userService.updateProfile(user, request));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload user avatar")
    public ResponseEntity<ApiResponse.UserProfile> uploadAvatar(
        @AuthenticationPrincipal User user,
        @RequestParam("file") MultipartFile file
    ) {
        return ResponseEntity.ok(userService.updateAvatar(user, file));
    }

    @PutMapping("/me/password")
    @Operation(summary = "Change password")
    public ResponseEntity<Void> changePassword(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody UserRequest.ChangePassword request
    ) {
        userService.changePassword(user, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    @Operation(summary = "Search users")
    public ResponseEntity<ApiResponse.PageResponse<ApiResponse.UserSummary>> searchUsers(
        @RequestParam(defaultValue = "") String query,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(userService.searchUsers(query,
            PageRequest.of(page, size, Sort.by("fullName"))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse.UserProfile> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
}
