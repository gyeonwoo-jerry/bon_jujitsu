package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SponsorRequest(
    @NotBlank(message = "제목을 입력해주세요")
    String title,
    String content,
    String url
) {

}
