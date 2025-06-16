package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.NotBlank;

public record OrderCancelRequest(
    @NotBlank String reason,
    String description
) {}
