package com.projectflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectflow.dto.request.AuthRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void register_ValidRequest_Returns201() throws Exception {
        AuthRequest.Register req = new AuthRequest.Register();
        req.setEmail("newuser@test.com");
        req.setUsername("newuser123");
        req.setPassword("Password1");

        mockMvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.accessToken").exists())
            .andExpect(jsonPath("$.refreshToken").exists());
    }

    @Test
    void register_InvalidEmail_Returns400() throws Exception {
        AuthRequest.Register req = new AuthRequest.Register();
        req.setEmail("not-an-email");
        req.setUsername("user");
        req.setPassword("Password1");

        mockMvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void login_InvalidCredentials_Returns401() throws Exception {
        AuthRequest.Login req = new AuthRequest.Login();
        req.setEmail("nonexistent@test.com");
        req.setPassword("WrongPassword1");

        mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isUnauthorized());
    }
}
