package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Board;
import bon.bon_jujitsu.domain.BoardImage;
import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.User;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record BoardResponse(
    Long id,
    String title,
    String content,
    String region,
    String name,
    List<String> images,
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
        .images(board.getImages().stream().map(BoardImage::getImagePath).toList())
        .createdAt(board.getCreatedAt())
        .modifiedAT(board.getModifiedAt())
        .build();
  }
}
