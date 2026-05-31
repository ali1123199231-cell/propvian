package com.smartlock.dto.request.verification;

import lombok.Data;
import org.hibernate.validator.constraints.URL;

@Data
public class SubmitOtaRequest {
    @URL
    private String airbnbListingUrl;

    @URL
    private String bookingListingUrl;

    @URL
    private String vrboListingUrl;
}
