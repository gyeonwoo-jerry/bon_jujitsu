package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Board;
import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.User;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record BoardResponse(
    Long id,
    String title,
    String content,
    String region,
    String name,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {

  public static BoardResponse fromEntity(Board board) {
    return BoardResponse.builder()
        .id(board.getId())
        .title(board.getTitle())
        .content(board.getContent())
        .region(board.getBranch().getRegion())
        .name(board.getUser().getName())
        .createdAt(board.getCreatedAt())
        .modifiedAT(board.getModifiedAt())
        .build();
  }
}
