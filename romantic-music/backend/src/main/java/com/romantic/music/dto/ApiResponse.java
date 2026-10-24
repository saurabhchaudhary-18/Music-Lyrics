package com.romantic.music.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Uniform JSON envelope returned by every API endpoint.
 *
 * @param success           whether the operation succeeded
 * @param message           human readable message safe to show in the UI
 * @param retryAfterSeconds only present on rate-limited responses
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse(boolean success, String message, Long retryAfterSeconds) {

    public static ApiResponse ok(String message) {
        return new ApiResponse(true, message, null);
    }

    public static ApiResponse error(String message) {
        return new ApiResponse(false, message, null);
    }

    public static ApiResponse rateLimited(String message, long retryAfterSeconds) {
        return new ApiResponse(false, message, retryAfterSeconds);
    }
}
