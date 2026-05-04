package com.projectflow.service;

import com.projectflow.dto.request.AuthRequest;
import com.projectflow.dto.response.ApiResponse;
import com.projectflow.entity.Role;
import com.projectflow.entity.User;
import com.projectflow.exception.BadRequestException;
import com.projectflow.repository.RoleRepository;
import com.projectflow.repository.UserRepository;
import com.projectflow.security.jwt.JwtTokenProvider;
import com.projectflow.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock AuthenticationManager authenticationManager;
    @Mock JwtTokenProvider jwtTokenProvider;
    @Mock RefreshTokenService refreshTokenService;

    @InjectMocks AuthServiceImpl authService;

    private Role userRole;
    private User testUser;

    @BeforeEach
    void setUp() {
        userRole = Role.builder().id(1L).name("ROLE_USER").build();
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        testUser = User.builder()
            .id(1L).email("test@example.com").username("testuser")
            .passwordHash("hashed").roles(roles).build();
    }

    @Test
    void register_Success() {
        AuthRequest.Register req = new AuthRequest.Register();
        req.setEmail("new@example.com");
        req.setUsername("newuser");
        req.setPassword("Password1");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any())).thenReturn(testUser);
        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("access-token");
        when(jwtTokenProvider.getAccessTokenExpiration()).thenReturn(900000L);
        when(refreshTokenService.createRefreshToken(any())).thenReturn(
            com.projectflow.entity.RefreshToken.builder().token("refresh-token")
                .expiresAt(java.time.Instant.now().plusSeconds(604800)).build());

        ApiResponse.Auth result = authService.register(req);

        assertThat(result.getAccessToken()).isEqualTo("access-token");
        assertThat(result.getRefreshToken()).isEqualTo("refresh-token");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_EmailAlreadyExists_ThrowsBadRequest() {
        AuthRequest.Register req = new AuthRequest.Register();
        req.setEmail("test@example.com");
        req.setUsername("newuser");
        req.setPassword("Password1");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Email already registered");
    }

    @Test
    void register_UsernameAlreadyExists_ThrowsBadRequest() {
        AuthRequest.Register req = new AuthRequest.Register();
        req.setEmail("new@example.com");
        req.setUsername("testuser");
        req.setPassword("Password1");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Username already taken");
    }

    @Test
    void login_Success() {
        AuthRequest.Login req = new AuthRequest.Login();
        req.setEmail("test@example.com");
        req.setPassword("Password1");

        var auth = new UsernamePasswordAuthenticationToken(testUser, null, testUser.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(jwtTokenProvider.generateAccessToken(any())).thenReturn("access-token");
        when(jwtTokenProvider.getAccessTokenExpiration()).thenReturn(900000L);
        when(refreshTokenService.createRefreshToken(any())).thenReturn(
            com.projectflow.entity.RefreshToken.builder().token("refresh-token")
                .expiresAt(java.time.Instant.now().plusSeconds(604800)).build());

        ApiResponse.Auth result = authService.login(req);

        assertThat(result.getAccessToken()).isEqualTo("access-token");
        assertThat(result.getUser().getEmail()).isEqualTo("test@example.com");
    }
}
