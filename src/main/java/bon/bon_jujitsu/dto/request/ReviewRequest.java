package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ReviewRequest(
    @NotNull(message = "내용을 입력해주세요")
    String content,
    @Min(0)
    @Max(5)
    double star,
    Long parentId,
    @NotNull
    Long itemId
) {

}
