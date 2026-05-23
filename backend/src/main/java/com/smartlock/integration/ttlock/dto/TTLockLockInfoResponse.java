package com.smartlock.integration.ttlock.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TTLockLockInfoResponse {
    @JsonProperty("errcode")
    private int errCode;

    @JsonProperty("errmsg")
    private String errMsg;

    @JsonProperty("lockId")
    private Long lockId;

    @JsonProperty("lockAlias")
    private String lockAlias;

    @JsonProperty("electricQuantity")
    private Integer electricQuantity;

    @JsonProperty("featureValue")
    private String featureValue;

    @JsonProperty("lockName")
    private String lockName;

    public boolean isSuccess() {
        return errCode == 0;
    }
}
