package com.smartlock.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import com.smartlock.repository.UserRepository;
import com.smartlock.util.LocaleSupport;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Locale;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    private final TemplateEngine templateEngine;
    private final JavaMailSender mailSender;
    private final Resend resend;
    private final String fromEmail;
    private final String fromName;
    private final MessageSource messageSource;
    private final UserRepository userRepository;

    public EmailService(
            TemplateEngine templateEngine,
            JavaMailSender mailSender,
            MessageSource messageSource,
            UserRepository userRepository,
            @Value("${resend.api-key:}") String apiKey,
            @Value("${app.mail.from-name:Propvian}") String fromName,
            @Value("${app.mail.from:noreply@propvian.com}") String fromEmail) {
        this.templateEngine = templateEngine;
        this.mailSender = mailSender;
        this.messageSource = messageSource;
        this.userRepository = userRepository;
        this.resend = apiKey.isBlank() ? null : new Resend(apiKey);
        this.fromName = fromName;
        this.fromEmail = fromEmail;
    }

    // ─── Localisation ────────────────────────────────────────────────────────

    /**
     * Language for a message addressed to one of our own users.
     *
     * Looked up here rather than threaded through all 20 call sites: the
     * recipient's address is the one thing every send already has, and the
     * account row is the authoritative record of what language they chose.
     * Unknown address (a guest, a cleaner) falls back to English.
     */
    private Locale localeForRecipient(String email) {
        if (email == null || email.isBlank()) return LocaleSupport.toLocale(null);
        try {
            return userRepository.findByEmail(email.toLowerCase())
                    .map(u -> LocaleSupport.toLocale(u.getLocale()))
                    .orElseGet(() -> LocaleSupport.toLocale(null));
        } catch (Exception e) {
            log.warn("localeForRecipient — lookup failed, defaulting to English: {}", e.getMessage());
            return LocaleSupport.toLocale(null);
        }
    }

    /** Resolves a subject line from the message bundles. */
    private String subject(String key, Locale locale, Object... args) {
        try {
            return messageSource.getMessage(key, args, locale);
        } catch (Exception e) {
            log.warn("subject — missing key {} for locale {}", key, locale);
            return messageSource.getMessage(key, args, Locale.ENGLISH);
        }
    }

    /** Thymeleaf context bound to a locale so #{...} keys resolve in that language. */
    private Context localizedContext(Locale locale) {
        return new Context(locale);
    }

    @PostConstruct
    public void logEmailConfig() {
        if (resend != null) {
            log.info("Email provider: Resend SDK | from={} | fromName={}", fromEmail, fromName);
        } else {
            log.info("Email provider: SMTP (MailHog/dev) | from={} | fromName={} | RESEND_API_KEY not set", fromEmail, fromName);
        }
    }

    @Async
    public void sendGuestAccessEmail(String toEmail, String guestName, String propertyName,
                                     String pin, String checkIn, String checkOut) {
        sendGuestAccessEmail(toEmail, guestName, propertyName, pin, checkIn, checkOut, null);
    }

    /** Guest-facing: locale comes from the booking site, not from an account. */
    @Async
    public void sendGuestAccessEmail(String toEmail, String guestName, String propertyName,
                                     String pin, String checkIn, String checkOut, String guestLocale) {
        Locale locale = LocaleSupport.toLocale(guestLocale);
        Context context = localizedContext(locale);
        context.setVariable("guestName", guestName);
        context.setVariable("propertyName", propertyName);
        context.setVariable("pin", pin);
        context.setVariable("checkIn", checkIn);
        context.setVariable("checkOut", checkOut);
        sendHtmlEmail(toEmail, subject("email.guestAccess.subject", locale, propertyName),
                "email/guest-access", context);
    }

    @Async
    public void sendCleanerTaskEmail(String toEmail, String cleanerName, String propertyName,
                                     String checkOutTime, String reservationId) {
        Locale locale = localeForRecipient(toEmail);
        Context context = localizedContext(locale);
        context.setVariable("cleanerName", cleanerName);
        context.setVariable("propertyName", propertyName);
        context.setVariable("checkOutTime", checkOutTime);
        context.setVariable("reservationId", reservationId);
        sendHtmlEmail(toEmail, subject("email.cleanerTask.subject", locale, propertyName),
                "email/cleaner-task", context);
    }

    @Async
    public void sendVerificationCodeEmail(String toEmail, String name, String code) {
        Locale locale = localeForRecipient(toEmail);
        Context context = localizedContext(locale);
        context.setVariable("name", name);
        context.setVariable("code", code);
        sendHtmlEmail(toEmail, subject("email.verificationCode.subject", locale, code),
                "email/verification-code", context);
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String firstName) {
        Locale locale = localeForRecipient(toEmail);
        Context context = localizedContext(locale);
        context.setVariable("firstName", firstName);
        sendHtmlEmail(toEmail, subject("email.welcome.subject", locale), "email/welcome", context);
    }

    @Async
    public void sendHostNotificationEmail(String hostEmail, String guestName, String propertyName,
                                          String pin, String checkIn, String checkOut,
                                          String checkinPageUrl) {
        Locale locale = localeForRecipient(hostEmail);
        Context context = localizedContext(locale);
        context.setVariable("guestName", guestName != null ? guestName
                : messageSource.getMessage("email.hostNotification.yourGuest", null, locale));
        context.setVariable("propertyName", propertyName);
        context.setVariable("pin", pin);
        context.setVariable("checkIn", checkIn);
        context.setVariable("checkOut", checkOut);
        context.setVariable("checkinPageUrl", checkinPageUrl);
        sendHtmlEmail(hostEmail, subject("email.hostNotification.subject", locale, propertyName),
                "email/host-notification", context);
    }

    @Async
    public void sendNewReservationEmail(String hostEmail, String guestName, String propertyName,
                                        String checkIn, String checkOut, String source, String dashboardUrl) {
        Locale locale = localeForRecipient(hostEmail);
        Context context = localizedContext(locale);
        context.setVariable("guestName", guestName);
        context.setVariable("propertyName", propertyName);
        context.setVariable("checkIn", checkIn);
        context.setVariable("checkOut", checkOut);
        context.setVariable("source", source);
        context.setVariable("dashboardUrl", dashboardUrl);
        String subjectKey = guestName != null
                ? "email.newReservation.subjectWithGuest"
                : "email.newReservation.subject";
        sendHtmlEmail(hostEmail, subject(subjectKey, locale, guestName, propertyName),
                "email/new-reservation", context);
    }

    @Async
    public void sendGuestBookingConfirmationEmail(String toEmail, String guestName, String propertyName,
                                                  String checkIn, String checkOut,
                                                  String totalAmount, String currency,
                                                  String senderName, String replyTo) {
        sendGuestBookingConfirmationEmail(toEmail, guestName, propertyName, checkIn, checkOut,
                totalAmount, currency, senderName, replyTo, null);
    }

    /** Guest-facing: pass the language the guest booked in so the receipt matches the site. */
    @Async
    public void sendGuestBookingConfirmationEmail(String toEmail, String guestName, String propertyName,
                                                  String checkIn, String checkOut,
                                                  String totalAmount, String currency,
                                                  String senderName, String replyTo, String guestLocale) {
        Locale locale = LocaleSupport.toLocale(guestLocale);
        Context context = localizedContext(locale);
        context.setVariable("guestName", guestName);
        context.setVariable("propertyName", propertyName);
        context.setVariable("checkIn", checkIn);
        context.setVariable("checkOut", checkOut);
        context.setVariable("totalAmount", totalAmount);
        context.setVariable("currency", currency);
        context.setVariable("senderName", senderName != null ? senderName : fromName);
        sendHtmlEmail(toEmail, subject("email.bookingConfirmation.subject", locale, propertyName),
                "email/guest-booking-confirmation", context, senderName, replyTo);
    }

    @Async
    public void sendEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        Context context = localizedContext(localeForRecipient(to));
        variables.forEach(context::setVariable);
        sendHtmlEmail(to, subject, templateName, context);
    }

    private void sendHtmlEmail(String to, String subject, String templateName, Context context) {
        sendHtmlEmail(to, subject, templateName, context, null, null);
    }

    private void sendHtmlEmail(String to, String subject, String templateName, Context context,
                                String overrideFromName, String replyTo) {
        String effectiveFromName = (overrideFromName != null && !overrideFromName.isBlank())
                ? overrideFromName : fromName;
        log.info("Sending email | provider={} | to={} | subject={} | template={} | fromName={}",
                resend != null ? "Resend" : "SMTP", to, subject, templateName, effectiveFromName);

        String html = templateEngine.process(templateName, context);

        if (resend != null) {
            sendViaResend(to, subject, html, effectiveFromName, replyTo);
        } else {
            sendViaSmtp(to, subject, html, effectiveFromName, replyTo);
        }
    }

    private void sendViaResend(String to, String subject, String html,
                                String effectiveFromName, String replyTo) {
        try {
            String from = effectiveFromName + " <" + fromEmail + ">";
            log.info("Resend API call | from={} | to={} | subject={} | replyTo={}", from, to, subject, replyTo);

            CreateEmailOptions.Builder builder = CreateEmailOptions.builder()
                    .from(from)
                    .to(to)
                    .subject(subject)
                    .html(html);
            if (replyTo != null && !replyTo.isBlank()) {
                builder.replyTo(replyTo);
            }

            CreateEmailResponse response = resend.emails().send(builder.build());
            log.info("Resend success | to={} | subject={} | messageId={}", to, subject, response.getId());

        } catch (ResendException e) {
            log.error("Resend API error | to={} | subject={} | error={}", to, subject, e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error sending via Resend | to={} | subject={} | error={}", to, subject, e.getMessage(), e);
        }
    }

    private void sendViaSmtp(String to, String subject, String html,
                              String effectiveFromName, String replyTo) {
        try {
            log.info("SMTP send | to={} | subject={} | replyTo={}", to, subject, replyTo);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, effectiveFromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            if (replyTo != null && !replyTo.isBlank()) {
                helper.setReplyTo(replyTo);
            }
            mailSender.send(message);
            log.info("SMTP success | to={} | subject={}", to, subject);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("SMTP error | to={} | subject={} | error={}", to, subject, e.getMessage(), e);
        }
    }
}
