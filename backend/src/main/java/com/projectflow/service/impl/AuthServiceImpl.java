package com.projectflow.service.impl;

import com.projectflow.dto.request.AuthRequest;
import com.projectflow.dto.response.ApiResponse;
import com.projectflow.entity.RefreshToken;
import com.projectflow.entity.Role;
import com.projectflow.entity.User;
import com.projectflow.exception.BadRequestException;
import com.projectflow.exception.UnauthorizedException;
import com.projectflow.repository.RoleRepository;
import com.projectflow.repository.UserRepository;
import com.projectflow.security.jwt.JwtTokenProvider;
import com.projectflow.service.AuthService;
import com.projectflow.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    @Override
    @Transactional
    public ApiResponse.Auth register(AuthRequest.Register request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already taken");
        }

        Role userRole = roleRepository.findByName("ROLE_USER")
            .orElseThrow(() -> new RuntimeException("Default role not found"));

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);

        User user = User.builder()
            .email(request.getEmail())
            .username(request.getUsername())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .emailVerified(false)
            .roles(roles)
            .build();

        User savedUser = userRepository.save(user);
        log.info("New user registered: {}", savedUser.getEmail());

        return buildAuthResponse(savedUser);
    }

    @Override
    @Transactional
    public ApiResponse.Auth login(AuthRequest.Login request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = (User) authentication.getPrincipal();
        log.info("User logged in: {}", user.getEmail());

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public ApiResponse.Auth refreshToken(String token) {
        RefreshToken refreshToken = refreshTokenService.findByToken(token)
            .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (!refreshToken.isValid()) {
            refreshTokenService.deleteToken(refreshToken);
            throw new UnauthorizedException("Refresh token expired or revoked");
        }

        User user = refreshToken.getUser();
        refreshTokenService.deleteToken(refreshToken);

        return buildAuthResponse(user);
    }

    @Override
    @Transactional
    public void logout(String token) {
        refreshTokenService.findByToken(token).ifPresent(refreshTokenService::deleteToken);
    }

    private ApiResponse.Auth buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return ApiResponse.Auth.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken.getToken())
            .tokenType("Bearer")
            .expiresIn(jwtTokenProvider.getAccessTokenExpiration())
            .user(ApiResponse.UserSummary.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .build())
            .build();
    }
}
