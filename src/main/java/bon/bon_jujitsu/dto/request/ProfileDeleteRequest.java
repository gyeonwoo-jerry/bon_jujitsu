package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ProfileDeleteRequest(
    @NotBlank(message = "비밀번호를 입력해주세요.")
    String password
){
}
