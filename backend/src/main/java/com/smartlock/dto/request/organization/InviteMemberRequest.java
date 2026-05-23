package com.smartlock.dto.request.organization;

import com.smartlock.domain.enums.MemberRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InviteMemberRequest {
    @Email
    @NotBlank
    private String email;

    @NotNull
    private MemberRole role;
}
