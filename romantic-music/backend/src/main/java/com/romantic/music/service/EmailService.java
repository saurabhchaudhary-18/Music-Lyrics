package com.romantic.music.service;

import com.romantic.music.config.MailConfig;
import com.romantic.music.exception.EmailSendException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter TIME_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a z", Locale.ENGLISH);

    private final JavaMailSender mailSender;
    private final MailConfig mailConfig;
    private final ZoneId zone;

    public EmailService(JavaMailSender mailSender,
                        MailConfig mailConfig,
                        @Value("${app.timezone}") String timezone) {
        this.mailSender = mailSender;
        this.mailConfig = mailConfig;
        this.zone = ZoneId.of(timezone);
    }

    /**
     * Sends the "Me gussa hoo" notification to the configured owner address.
     *
     * @throws EmailSendException if mail is not configured or the SMTP server rejects the message
     */
    public void sendAngryNotification(Instant clickedAt) {
        if (!mailConfig.isConfigured()) {
            throw new EmailSendException("Notification recipient (NOTIFY_TO) is not configured.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(mailConfig.getTo());
        if (mailConfig.getFrom() != null && !mailConfig.getFrom().isBlank()) {
            message.setFrom(mailConfig.getFrom());
        }
        message.setSubject("Someone clicked the Angry Button! ❤️");
        message.setText(buildBody(clickedAt));

        try {
            mailSender.send(message);
            log.info("Angry-button notification sent");
        } catch (MailException ex) {
            throw new EmailSendException("SMTP delivery failed", ex);
        }
    }

    String buildBody(Instant clickedAt) {
        String time = ZonedDateTime.ofInstant(clickedAt, zone).format(TIME_FORMAT);
        return "Someone visited your special website and clicked the 'Me gussa hoo' button.\n\n"
                + "Lagta hai abhi bhi gussa hai! 😅❤️\n\n"
                + "Time: " + time;
    }
}
