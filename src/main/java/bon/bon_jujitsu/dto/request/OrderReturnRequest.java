package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.NotBlank;

public record OrderReturnRequest(
    @NotBlank String reason,      // 반품 사유 (필수)
    @NotBlank String description  // 상세 설명 (필수 - 반품은 상세 설명 필요)
) {}
