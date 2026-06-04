package com.smartlock.dto.request.verification;

import lombok.Data;
import org.hibernate.validator.constraints.URL;

import java.util.List;

@Data
public class SubmitOtaRequest {
    @URL
    private String airbnbListingUrl;

    @URL
    private String bookingListingUrl;

    @URL
    private String vrboListingUrl;

    private List<String> otherListingUrls;
}
