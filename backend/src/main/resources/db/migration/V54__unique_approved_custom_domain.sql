-- Partial unique index: only one org may hold APPROVED status for any given custom domain.
-- PENDING duplicates are intentionally allowed (first-to-verify-wins logic in VerificationService).
CREATE UNIQUE INDEX uq_host_verif_domain_approved
    ON host_verifications (custom_domain)
    WHERE domain_status = 'APPROVED'
      AND custom_domain IS NOT NULL;
