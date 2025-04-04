package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Board;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record BoardResponse(
        Long id,
        String title,
        String content,
        String region,
        String author,
        List<String> images,
        Long viewCount,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
  public static BoardResponse fromEntity(Board board, List<String> imagePaths) {
    return BoardResponse.builder()
            .id(board.getId())
            .title(board.getTitle())
            .content(board.getContent())
            .region(board.getBranch().getRegion())
            .author(board.getUser().getName())
            .images(imagePaths)
            .viewCount(board.getViewCount())
            .createdAt(board.getCreatedAt())
            .modifiedAt(board.getModifiedAt())
            .build();
  }
}