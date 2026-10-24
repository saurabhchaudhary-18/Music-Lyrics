package com.romantic.music.controller;

import com.romantic.music.exception.EmailSendException;
import com.romantic.music.exception.GlobalExceptionHandler;
import com.romantic.music.exception.RateLimitException;
import com.romantic.music.service.InteractionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InteractionController.class)
@Import(GlobalExceptionHandler.class)
class InteractionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private InteractionService interactionService;

    @Test
    void returnsSuccessEnvelope() throws Exception {
        mockMvc.perform(post("/api/interaction/angry")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"source\":\"welcome-card\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Notification sent successfully!"));
    }

    @Test
    void acceptsEmptyBody() throws Exception {
        mockMvc.perform(post("/api/interaction/angry"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void rejectsInvalidSource() throws Exception {
        mockMvc.perform(post("/api/interaction/angry")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"source\":\"<script>alert(1)</script>\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void rateLimitReturns429WithRetryAfter() throws Exception {
        doThrow(new RateLimitException("slow down", 42)).when(interactionService).handleAngryClick(anyString());

        mockMvc.perform(post("/api/interaction/angry"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "42"))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.retryAfterSeconds").value(42));
    }

    @Test
    void emailFailureReturns502WithoutLeakingDetails() throws Exception {
        doThrow(new EmailSendException("smtp password wrong")).when(interactionService).handleAngryClick(anyString());

        mockMvc.perform(post("/api/interaction/angry"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(
                        "Could not send the notification right now. Please try again later."));
    }
}
