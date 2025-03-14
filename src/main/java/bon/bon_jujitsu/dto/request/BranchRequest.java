package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.NotBlank;

public record BranchRequest (
    @NotBlank(message = "지역을 입력해주세요")
    String region,
    @NotBlank(message = "체육관 주소를 입력해주세요")
    String address
) {
}
