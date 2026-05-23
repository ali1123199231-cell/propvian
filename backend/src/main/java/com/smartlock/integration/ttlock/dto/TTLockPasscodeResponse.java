package com.smartlock.integration.ttlock.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TTLockPasscodeResponse {
    @JsonProperty("errcode")
    private int errCode;

    @JsonProperty("errmsg")
    private String errMsg;

    @JsonProperty("keyboardPwdId")
    private Long keyboardPwdId;

    public boolean isSuccess() {
        return errCode == 0;
    }
}
