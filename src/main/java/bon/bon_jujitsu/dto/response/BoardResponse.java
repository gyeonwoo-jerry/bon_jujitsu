package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Board;
import bon.bon_jujitsu.domain.BoardImage;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record BoardResponse(
        Long id,
        String title,
        String content,
        String region,
        String author,
        List<String> images,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
  public static BoardResponse fromEntity(Board board, List<String> imagePaths) {
    return BoardResponse.builder()
            .id(board.getId())
            .title(board.getTitle())
            .content(board.getContent())
            .region(board.getBranch().getRegion())
            .author(board.getUser().getName()) // `name` → `author`로 가독성 개선
            .images(imagePaths) // 이미지는 따로 주입받음
            .createdAt(board.getCreatedAt())
            .modifiedAt(board.getModifiedAt())
            .build();
  }
}