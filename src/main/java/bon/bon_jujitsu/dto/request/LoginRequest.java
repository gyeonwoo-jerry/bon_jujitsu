package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.NotNull;

public record LoginRequest(
    @NotNull(message = "아이디를 입력해주세요.")
    String memberId,
    @NotNull(message = "비밀번호를 입력하세요")
    String password
) {
}
