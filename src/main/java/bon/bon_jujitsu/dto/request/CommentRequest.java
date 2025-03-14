package bon.bon_jujitsu.dto.request;

import bon.bon_jujitsu.domain.CommentType;
import jakarta.validation.constraints.NotNull;

public record CommentRequest(
    @NotNull(message = "내용을 입력해주세요")
    String content,
    Long parentId,
    @NotNull
    CommentType commentType,
    @NotNull
    Long targetId
) {
}
