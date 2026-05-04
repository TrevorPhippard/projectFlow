package com.projectflow.service;

import com.projectflow.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${app.upload.avatar-directory}")
    private String avatarDirectory;

    @Value("${app.upload.allowed-types}")
    private String allowedTypes;

    @Value("${app.upload.max-size}")
    private long maxSize;

    public String storeAvatar(MultipartFile file, Long userId) {
        validateFile(file);

        String extension = getFileExtension(file.getOriginalFilename());
        String filename = "avatar_" + userId + "_" + UUID.randomUUID() + "." + extension;

        try {
            Path uploadPath = Paths.get(avatarDirectory);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path targetPath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/avatars/" + filename;
        } catch (IOException e) {
            log.error("Failed to store avatar file: {}", e.getMessage());
            throw new RuntimeException("Failed to store file", e);
        }
    }

    public void deleteFile(String fileUrl) {
        if (!StringUtils.hasText(fileUrl)) return;

        try {
            String filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
            Path filePath = Paths.get(avatarDirectory).resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Failed to delete file: {}", fileUrl);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        if (file.getSize() > maxSize) {
            throw new BadRequestException("File size exceeds maximum allowed size of " + (maxSize / 1024 / 1024) + "MB");
        }

        List<String> allowed = Arrays.asList(allowedTypes.split(","));
        String contentType = file.getContentType();
        if (contentType == null || !allowed.contains(contentType)) {
            throw new BadRequestException("File type not allowed. Allowed types: " + allowedTypes);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "jpg";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
