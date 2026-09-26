package com.smartlock.service;

import com.smartlock.domain.TapCode;
import com.smartlock.domain.enums.TapCodeKind;
import com.smartlock.dto.response.guestpage.TapCodeBatchResponse;
import com.smartlock.dto.response.guestpage.TapCodeResponse;
import com.smartlock.exception.AppException;
import com.smartlock.repository.TapCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Issues the short codes behind /g/{code}: one per guest page, plus batches of
 * unclaimed codes for printing onto physical stands and cards.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TapCodeService {

    // No 0/O or 1/I/L: these codes get typed in from paper and read out over the phone.
    static final String ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    static final int LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final TapCodeRepository tapCodeRepository;

    @Value("${app.frontend-url:https://propvian.com}")
    private String frontendUrl;

    /** Uppercases and strips anything outside the alphabet, so "k7m2-qx9p" still resolves. */
    public String normalize(String raw) {
        if (raw == null) return "";
        String upper = raw.trim().toUpperCase();
        StringBuilder sb = new StringBuilder(upper.length());
        for (char c : upper.toCharArray()) {
            if (ALPHABET.indexOf(c) >= 0) sb.append(c);
        }
        return sb.toString();
    }

    @Transactional
    public TapCode issuePropertyCode(UUID orgId, UUID propertyId) {
        TapCode code = TapCode.builder()
                .code(newUniqueCode())
                .kind(TapCodeKind.PROPERTY)
                .organizationId(orgId)
                .propertyId(propertyId)
                .build();
        code = tapCodeRepository.save(code);
        log.info("TapCodeService.issuePropertyCode — property={} code={}", propertyId, code.getCode());
        return code;
    }

    @Transactional
    public TapCodeBatchResponse generateBatch(int count, String batchLabel) {
        String label = batchLabel.trim();
        if (tapCodeRepository.existsByBatchLabel(label)) {
            throw new AppException("A batch with this label already exists", HttpStatus.CONFLICT, "BATCH_EXISTS");
        }
        List<TapCode> codes = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            codes.add(TapCode.builder()
                    .code(newUniqueCode())
                    .kind(TapCodeKind.PRODUCT)
                    .batchLabel(label)
                    .build());
        }
        List<TapCode> saved = tapCodeRepository.saveAll(codes);
        log.info("TapCodeService.generateBatch — label={} count={}", label, saved.size());
        return TapCodeBatchResponse.builder()
                .batchLabel(label)
                .issued(saved.size())
                .codes(saved.stream().map(c -> toResponse(c, 0)).toList())
                .build();
    }

    @Transactional(readOnly = true)
    public List<TapCodeBatchResponse> batchSummaries() {
        Map<String, Long> scanned = new HashMap<>();
        for (Object[] row : tapCodeRepository.countScannedCodesByBatch()) {
            scanned.put((String) row[0], ((Number) row[1]).longValue());
        }
        return tapCodeRepository.summarizeProductBatches().stream()
                .map(b -> TapCodeBatchResponse.builder()
                        .batchLabel(b.getBatchLabel())
                        .issued(b.getIssued())
                        .claimed(b.getClaimed())
                        .scanned(scanned.getOrDefault(b.getBatchLabel(), 0L))
                        .createdAt(b.getCreatedAt())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public TapCodeBatchResponse batch(String batchLabel) {
        List<TapCode> codes = tapCodeRepository.findByBatchLabelOrderByCodeAsc(batchLabel);
        if (codes.isEmpty()) {
            throw new AppException("Batch not found", HttpStatus.NOT_FOUND, "BATCH_NOT_FOUND");
        }
        return TapCodeBatchResponse.builder()
                .batchLabel(batchLabel)
                .issued(codes.size())
                .claimed(codes.stream().filter(c -> c.getClaimedAt() != null).count())
                .scanned(tapCodeRepository.countScannedCodesInBatch(batchLabel))
                .createdAt(codes.stream().map(TapCode::getCreatedAt).min(java.util.Comparator.naturalOrder()).orElse(null))
                .codes(codes.stream().map(c -> toResponse(c, 0)).toList())
                .build();
    }

    public String publicUrl(String code) {
        return frontendUrl + "/g/" + code;
    }

    public TapCodeResponse toResponse(TapCode c, long views30d) {
        String url = publicUrl(c.getCode());
        return TapCodeResponse.builder()
                .code(c.getCode())
                .kind(c.getKind().name())
                .url(url)
                .qrUrl(url + "?s=q")
                .nfcUrl(url + "?s=n")
                .batchLabel(c.getBatchLabel())
                .claimedAt(c.getClaimedAt())
                .views30d(views30d)
                .build();
    }

    private String newUniqueCode() {
        // 31^8 ≈ 8.5e11 codes: collisions are rare enough that a few retries always suffice.
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(LENGTH);
            for (int i = 0; i < LENGTH; i++) {
                sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
            }
            String code = sb.toString();
            if (!tapCodeRepository.existsById(code)) return code;
        }
        throw new IllegalStateException("Failed to generate a unique tap code");
    }
}
