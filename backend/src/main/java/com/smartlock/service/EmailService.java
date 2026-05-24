package com.smartlock.service;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
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
@Slf4j
public class EmailService {

    private final TemplateEngine templateEngine;
    private final JavaMailSender mailSender;
    private final Resend resend;
    private final String fromEmail;
    private final String fromName;

    public EmailService(
            TemplateEngine templateEngine,
            JavaMailSender mailSender,
            @Value("${resend.api-key:}") String apiKey,
            @Value("${app.mail.from-name:Propvian}") String fromName,
            @Value("${app.mail.from:noreply@propvian.com}") String fromEmail) {
        this.templateEngine = templateEngine;
        this.mailSender = mailSender;
        this.resend = apiKey.isBlank() ? null : new Resend(apiKey);
        this.fromName = fromName;
        this.fromEmail = fromEmail;
    }

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
        sendHtmlEmail(toEmail, "Your Propvian verification code: " + code, "email/verification-code", context);
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String firstName) {
        Context context = new Context();
        context.setVariable("firstName", firstName);
        sendHtmlEmail(toEmail, "Welcome to Propvian!", "email/welcome", context);
    }

    @Async
    public void sendEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        Context context = new Context();
        variables.forEach(context::setVariable);
        sendHtmlEmail(to, subject, templateName, context);
    }

    private void sendHtmlEmail(String to, String subject, String templateName, Context context) {
        String html = templateEngine.process(templateName, context);

        if (resend != null) {
            sendViaResend(to, subject, html);
        } else {
            sendViaSmtp(to, subject, html);
        }
    }

    private void sendViaResend(String to, String subject, String html) {
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromName + " <" + fromEmail + ">")
                    .to(to)
                    .subject(subject)
                    .html(html)
                    .build();
            CreateEmailResponse response = resend.emails().send(params);
            log.debug("Email sent via Resend to={} subject={} id={}", to, subject, response.getId());
        } catch (Exception e) {
            log.error("Failed to send email via Resend to={} subject={}: {}", to, subject, e.getMessage());
        }
    }

    private void sendViaSmtp(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.debug("Email sent via SMTP (MailHog) to={} subject={}", to, subject);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email via SMTP to={} subject={}: {}", to, subject, e.getMessage());
        }
    }
}
