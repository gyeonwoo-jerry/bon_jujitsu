package bon.bon_jujitsu.dto.update;

import jakarta.validation.constraints.NotBlank;

public record GuestQnAUpdate(
        @NotBlank(message = "제목은 필수입니다.")
        String title,

        @NotBlank(message = "내용은 필수입니다.")
        String content,

        @NotBlank(message = "비밀번호는 필수입니다.")
        String password
) {}