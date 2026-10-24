package com.romantic.music.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Optional metadata sent by the frontend alongside an interaction.
 * Every field is optional, but bounded so the endpoint cannot be abused to push large payloads.
 */
public class InteractionRequest {

    @Size(max = 50, message = "source must be at most 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_\\- ]*$", message = "source contains invalid characters")
    private String source = "welcome-card";

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
