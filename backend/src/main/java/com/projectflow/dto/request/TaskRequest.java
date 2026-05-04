package com.projectflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

public class TaskRequest {

    @Data
    public static class Create {
        @NotBlank(message = "Task title is required")
        @Size(min = 2, max = 500, message = "Title must be 2-500 characters")
        private String title;

        @Size(max = 5000, message = "Description too long")
        private String description;

        private String status = "TODO";

        private String priority = "MEDIUM";

        private Long assigneeId;

        private LocalDate dueDate;

        private Integer storyPoints;

        private List<String> tags;
    }

    @Data
    public static class Update {
        @Size(min = 2, max = 500, message = "Title must be 2-500 characters")
        private String title;

        @Size(max = 5000, message = "Description too long")
        private String description;

        private String status;

        private String priority;

        private Long assigneeId;

        private LocalDate dueDate;

        private Integer storyPoints;

        private List<String> tags;
    }

    @Data
    public static class UpdatePosition {
        private String status;
        private Integer position;
    }

    @Data
    public static class AddComment {
        @NotBlank(message = "Comment content is required")
        @Size(min = 1, max = 5000, message = "Comment too long")
        private String content;
    }
}
