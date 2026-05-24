package com.smartlock.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Async
    public void sendGuestAccessEmail(String toEmail, String guestName, String propertyName,
                                     String pin, String checkIn, String checkOut) {
        Context context = new Context();
        context.setVariable("guestName", guestName);
        context.setVariable("propertyName", propertyName);
        context.setVariable("pin", pin);
        context.setVariable("checkIn", checkIn);
        context.setVariable("checkOut", checkOut);
        sendHtmlEmail(toEmail, "Your Access Code for " + propertyName, "email/guest-access", context);
    }

    @Async
    public void sendCleanerTaskEmail(String toEmail, String cleanerName, String propertyName,
                                     String checkOutTime, String reservationId) {
        Context context = new Context();
        context.setVariable("cleanerName", cleanerName);
        context.setVariable("propertyName", propertyName);
        context.setVariable("checkOutTime", checkOutTime);
        context.setVariable("reservationId", reservationId);
        sendHtmlEmail(toEmail, "Cleaning Task: " + propertyName, "email/cleaner-task", context);
    }

    @Async
    public void sendVerificationCodeEmail(String toEmail, String name, String code) {
        Context context = new Context();
        context.setVariable("name", name);
        context.setVariable("code", code);
        sendHtmlEmail(toEmail, "Your SmartLock verification code: " + code, "email/verification-code", context);
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String firstName) {
        Context context = new Context();
        context.setVariable("firstName", firstName);
        sendHtmlEmail(toEmail, "Welcome to SmartLock!", "email/welcome", context);
    }

    @Async
    public void sendEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        Context context = new Context();
        variables.forEach(context::setVariable);
        sendHtmlEmail(to, subject, templateName, context);
    }

    private void sendHtmlEmail(String to, String subject, String templateName, Context context) {
        try {
            String html = templateEngine.process(templateName, context);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.debug("Email sent to {}: {}", to, subject);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
