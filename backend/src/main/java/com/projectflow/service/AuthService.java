package com.projectflow.service;

import com.projectflow.dto.request.AuthRequest;
import com.projectflow.dto.response.ApiResponse;

public interface AuthService {
    ApiResponse.Auth register(AuthRequest.Register request);
    ApiResponse.Auth login(AuthRequest.Login request);
    ApiResponse.Auth refreshToken(String refreshToken);
    void logout(String refreshToken);
}
