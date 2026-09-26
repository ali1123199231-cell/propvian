package com.smartlock.dto.response.guestpage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/** A production run of pre-printed codes, with its funnel: issued → scanned → claimed. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TapCodeBatchResponse {
    private String batchLabel;
    private long issued;
    private long scanned;
    private long claimed;
    private Instant createdAt;
    private List<TapCodeResponse> codes;   // only on generate and on a single-batch fetch
}
