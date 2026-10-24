package com.romantic.music.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Notification mail settings bound from {@code app.mail.*}.
 * SMTP host and credentials are configured through {@code spring.mail.*} (environment variables).
 */
@Configuration
@ConfigurationProperties(prefix = "app.mail")
public class MailConfig {

    /** Recipient of the notification (the site owner). */
    private String to;

    /** Sender address. */
    private String from;

    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public boolean isConfigured() {
        return to != null && !to.isBlank();
    }
}
