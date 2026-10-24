package com.romantic.music.service;

import com.romantic.music.exception.EmailSendException;
import com.romantic.music.exception.RateLimitException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class InteractionServiceTest {

    /** Clock whose time the test can move forward. */
    private static class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-01-01T10:00:00Z");

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override public java.time.ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }

    private EmailService emailService;
    private MutableClock clock;
    private InteractionService service;

    @BeforeEach
    void setUp() {
        emailService = mock(EmailService.class);
        clock = new MutableClock();
        service = new InteractionService(emailService, clock, Duration.ofSeconds(60), 3);
    }

    @Test
    void firstClickSendsEmail() {
        service.handleAngryClick("1.1.1.1");
        verify(emailService, times(1)).sendAngryNotification(any());
    }

    @Test
    void secondClickInsideCooldownIsRejectedWithRetryAfter() {
        service.handleAngryClick("1.1.1.1");
        clock.advance(Duration.ofSeconds(20));

        RateLimitException ex = assertThrows(RateLimitException.class,
                () -> service.handleAngryClick("1.1.1.1"));

        assertEquals(40, ex.getRetryAfterSeconds());
        verify(emailService, times(1)).sendAngryNotification(any());
    }

    @Test
    void clickAfterCooldownIsAllowed() {
        service.handleAngryClick("1.1.1.1");
        clock.advance(Duration.ofSeconds(61));

        assertDoesNotThrow(() -> service.handleAngryClick("1.1.1.1"));
        verify(emailService, times(2)).sendAngryNotification(any());
    }

    @Test
    void differentClientsDoNotShareCooldown() {
        service.handleAngryClick("1.1.1.1");
        assertDoesNotThrow(() -> service.handleAngryClick("2.2.2.2"));
    }

    @Test
    void globalHourlyCeilingIsEnforced() {
        service.handleAngryClick("a");
        service.handleAngryClick("b");
        service.handleAngryClick("c");

        assertThrows(RateLimitException.class, () -> service.handleAngryClick("d"));

        clock.advance(Duration.ofMinutes(61));
        assertDoesNotThrow(() -> service.handleAngryClick("d"));
    }

    @Test
    void failedSendDoesNotConsumeTheCooldown() {
        doThrow(new EmailSendException("smtp down")).when(emailService).sendAngryNotification(any());
        assertThrows(EmailSendException.class, () -> service.handleAngryClick("1.1.1.1"));

        // Mail recovers; the same visitor can retry immediately.
        org.mockito.Mockito.reset(emailService);
        assertDoesNotThrow(() -> service.handleAngryClick("1.1.1.1"));
        verify(emailService, times(1)).sendAngryNotification(any());
    }
}
