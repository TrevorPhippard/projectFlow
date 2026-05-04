package com.projectflow.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class UserRequest {

    @Data
    public static class UpdateProfile {
        @Size(max = 200, message = "Full name too long")
        private String fullName;

        @Size(max = 500, message = "Bio too long")
        private String bio;
    }

    @Data
    public static class ChangePassword {
        private String currentPassword;

        @Size(min = 8, message = "Password must be at least 8 characters")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, and one number")
        private String newPassword;
    }
}
