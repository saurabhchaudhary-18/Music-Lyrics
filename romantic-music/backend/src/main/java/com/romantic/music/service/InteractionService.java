package com.romantic.music.service;

import com.romantic.music.exception.RateLimitException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;

/**
 * Coordinates interactions and protects the email endpoint from repeated submissions.
 *
 * <ul>
 *   <li>Per-client cooldown: one email per client per cooldown window.</li>
 *   <li>Global ceiling: at most {@code maxPerHour} emails per rolling hour, so the inbox
 *       cannot be flooded even by many different clients.</li>
 * </ul>
 * State is in-memory, which is appropriate for a single-instance personal site.
 */
@Service
public class InteractionService {

    private static final Logger log = LoggerFactory.getLogger(InteractionService.class);

    private final EmailService emailService;
    private final Clock clock;
    private final Duration cooldown;
    private final int maxPerHour;

    private final Map<String, Instant> lastSentByClient = new HashMap<>();
    private final Deque<Instant> sentInLastHour = new ArrayDeque<>();

    @Autowired
    public InteractionService(EmailService emailService,
                              @Value("${app.rate-limit.cooldown-seconds}") long cooldownSeconds,
                              @Value("${app.rate-limit.max-per-hour}") int maxPerHour) {
        this(emailService, Clock.systemUTC(), Duration.ofSeconds(cooldownSeconds), maxPerHour);
    }

    InteractionService(EmailService emailService, Clock clock, Duration cooldown, int maxPerHour) {
        this.emailService = emailService;
        this.clock = clock;
        this.cooldown = cooldown;
        this.maxPerHour = maxPerHour;
    }

    public void handleAngryClick(String clientKey) {
        Instant now = clock.instant();
        reserveSlot(clientKey, now);
        try {
            emailService.sendAngryNotification(now);
        } catch (RuntimeException ex) {
            // A failed send must not lock the visitor out of trying again.
            releaseSlot(clientKey, now);
            throw ex;
        }
    }

    private synchronized void reserveSlot(String clientKey, Instant now) {
        pruneExpired(now);

        Instant last = lastSentByClient.get(clientKey);
        if (last != null) {
            Duration remaining = cooldown.minus(Duration.between(last, now));
            if (!remaining.isNegative() && !remaining.isZero()) {
                long seconds = ceilSeconds(remaining);
                log.info("Cooldown active for a client, {}s remaining", seconds);
                throw new RateLimitException(
                        "Already sent! Please wait a little before trying again.", seconds);
            }
        }

        if (sentInLastHour.size() >= maxPerHour) {
            Instant oldest = sentInLastHour.peekFirst();
            long retry = 60;
            if (oldest != null) {
                retry = Math.max(1, ceilSeconds(Duration.ofHours(1).minus(Duration.between(oldest, now))));
            }
            log.warn("Global hourly email ceiling reached");
            throw new RateLimitException("Too many requests right now. Please try again later.", retry);
        }

        lastSentByClient.put(clientKey, now);
        sentInLastHour.addLast(now);
    }

    private synchronized void releaseSlot(String clientKey, Instant reservedAt) {
        lastSentByClient.remove(clientKey, reservedAt);
        sentInLastHour.removeLastOccurrence(reservedAt);
    }

    private static long ceilSeconds(Duration d) {
        return (d.toMillis() + 999) / 1000;
    }

    private void pruneExpired(Instant now) {
        lastSentByClient.values().removeIf(t -> Duration.between(t, now).compareTo(cooldown) >= 0);
        Instant hourAgo = now.minus(Duration.ofHours(1));
        while (!sentInLastHour.isEmpty() && sentInLastHour.peekFirst().isBefore(hourAgo)) {
            sentInLastHour.pollFirst();
        }
    }
}
