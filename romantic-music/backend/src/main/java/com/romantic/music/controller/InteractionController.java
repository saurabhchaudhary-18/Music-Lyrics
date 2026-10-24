package com.romantic.music.controller;

import com.romantic.music.dto.ApiResponse;
import com.romantic.music.dto.InteractionRequest;
import com.romantic.music.service.InteractionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interaction")
public class InteractionController {

    private static final Logger log = LoggerFactory.getLogger(InteractionController.class);

    private final InteractionService interactionService;

    public InteractionController(InteractionService interactionService) {
        this.interactionService = interactionService;
    }

    @PostMapping("/angry")
    public ResponseEntity<ApiResponse> angry(
            @Valid @RequestBody(required = false) InteractionRequest request,
            HttpServletRequest http) {

        String source = request != null ? request.getSource() : "unknown";
        log.info("Angry button interaction received (source={})", source);

        interactionService.handleAngryClick(http.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Notification sent successfully!"));
    }
}
