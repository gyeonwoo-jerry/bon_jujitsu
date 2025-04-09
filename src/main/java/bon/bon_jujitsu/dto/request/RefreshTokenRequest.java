package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.NotNull;

public record RefreshTokenRequest(
    @NotNull(message = "리프레시 토큰을 입력해주세요.")
    String refreshToken
) {
}
