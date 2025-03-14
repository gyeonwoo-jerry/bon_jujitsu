package bon.bon_jujitsu.dto.request;

import bon.bon_jujitsu.domain.Stripe;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SignupRequest (
    @NotBlank(message = "이름을 입력해주세요.")
    String name,
    @NotBlank(message = "아이디를 입력해주세요.")
    String nickname,
    @NotBlank(message = "비밀번호를 입력해 주세요")
    String password,
    @Email(message = "이메일 형식에 맞게 작성해주세요.")
    @NotBlank(message = "이메일은 필수 입력 사항입니다.")
    String email,
    @NotBlank(message = "휴대전화 번호를 입력해주세요.")
    String phoneNum,
    @NotBlank(message = "주소를 입력해주세요.")
    String address,
    @NotBlank(message = "생일을 입력해주세요.")
    String birthday,
    @NotBlank(message = "성별을 입력해주세요.")
    String gender,
    @NotNull(message = "지점을 입력해주세요.")
    Long branchId,
    @Min(1)
    int level,
    Stripe stripe
){
}
