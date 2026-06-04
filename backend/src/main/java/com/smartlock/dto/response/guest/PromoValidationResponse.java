package com.smartlock.dto.response.guest;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.IOException;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromoValidationResponse {
    private boolean valid;
    private String code;
    private String discountType;   // PERCENT | FIXED
    @JsonSerialize(using = PlainBigDecimalSerializer.class)
    private BigDecimal discountValue;
    private String message;

    /** Serializes BigDecimal as a plain number with no trailing zeros (10.0 → 10, 19.5 → 19.5). */
    public static class PlainBigDecimalSerializer extends JsonSerializer<BigDecimal> {
        @Override
        public void serialize(BigDecimal value, JsonGenerator gen, SerializerProvider provider) throws IOException {
            gen.writeNumber(value.stripTrailingZeros().toPlainString());
        }
    }
}
