package com.projectflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class ProjectRequest {

    @Data
    public static class Create {
        @NotBlank(message = "Project name is required")
        @Size(min = 2, max = 200, message = "Name must be 2-200 characters")
        private String name;

        @Size(max = 2000, message = "Description too long")
        private String description;

        @NotBlank(message = "Project key is required")
        @Size(min = 2, max = 10, message = "Key must be 2-10 characters")
        @Pattern(regexp = "^[A-Z0-9]+$", message = "Key must be uppercase letters and numbers only")
        private String key;

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a valid hex color")
        private String color;
    }

    @Data
    public static class Update {
        @Size(min = 2, max = 200, message = "Name must be 2-200 characters")
        private String name;

        @Size(max = 2000, message = "Description too long")
        private String description;

        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a valid hex color")
        private String color;

        private String status;
    }

    @Data
    public static class InviteMember {
        @NotBlank(message = "Email is required")
        private String email;

        private String role = "MEMBER";
    }

    @Data
    public static class UpdateMemberRole {
        @NotBlank(message = "Role is required")
        private String role;
    }
}
