package com.smartlock.dto.request.verification;

import lombok.Data;
import org.hibernate.validator.constraints.URL;

import java.util.List;

@Data
public class ConnectCalendarRequest {
    @URL
    private String airbnbIcalUrl;

    @URL
    private String bookingIcalUrl;

    @URL
    private String vrboIcalUrl;

    private List<String> otherIcalUrls;
}
