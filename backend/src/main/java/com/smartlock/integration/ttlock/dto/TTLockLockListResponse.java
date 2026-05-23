package com.smartlock.integration.ttlock.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class TTLockLockListResponse {

    @JsonProperty("errcode")
    private int errCode;

    @JsonProperty("errmsg")
    private String errMsg;

    @JsonProperty("list")
    private List<LockItem> list;

    @JsonProperty("pageNo")
    private int pageNo;

    @JsonProperty("pageSize")
    private int pageSize;

    @JsonProperty("pages")
    private int pages;

    @JsonProperty("total")
    private int total;

    public boolean isSuccess() {
        return errCode == 0;
    }

    @Data
    public static class LockItem {
        @JsonProperty("lockId")
        private Long lockId;

        @JsonProperty("lockAlias")
        private String lockAlias;

        @JsonProperty("lockName")
        private String lockName;

        @JsonProperty("electricQuantity")
        private Integer electricQuantity;

        @JsonProperty("featureValue")
        private String featureValue;
    }
}
