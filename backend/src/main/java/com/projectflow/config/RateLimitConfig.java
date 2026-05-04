package com.projectflow.config;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Refill;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RateLimitConfig {

    @Bean
    public RateLimitFilter rateLimitFilter() {
        return new RateLimitFilter();
    }

    public static class RateLimitFilter extends OncePerRequestFilter {

        private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

        @Override
        protected void doFilterInternal(HttpServletRequest request,
                                        HttpServletResponse response,
                                        FilterChain filterChain) throws ServletException, IOException {

            // Only rate limit auth endpoints
            String path = request.getRequestURI();
            if (path.contains("/auth/login") || path.contains("/auth/register")) {
                String key = getClientKey(request);
                Bucket bucket = buckets.computeIfAbsent(key, k -> createBucket());

                if (!bucket.tryConsume(1)) {
                    response.setStatus(429);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"status\":429,\"message\":\"Too many requests. Please try again later.\"}");
                    return;
                }
            }

            filterChain.doFilter(request, response);
        }

        private Bucket createBucket() {
            Bandwidth limit = Bandwidth.classic(
                    10,
                    Refill.greedy(10, Duration.ofMinutes(1))
            );

            return Bucket.builder()
                    .addLimit(limit)
                    .build();
        }

        private String getClientKey(HttpServletRequest request) {
            String xfHeader = request.getHeader("X-Forwarded-For");
            return xfHeader != null ? xfHeader.split(",")[0] : request.getRemoteAddr();
        }
    }
}
