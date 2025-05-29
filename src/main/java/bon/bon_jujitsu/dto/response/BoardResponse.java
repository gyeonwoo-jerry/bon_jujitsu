package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Board;
import bon.bon_jujitsu.domain.PostImage;
import java.util.stream.Collectors;
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
    List<ImageResponse> images,
    Long viewCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
  public static BoardResponse fromEntity(Board board, List<PostImage> postImages) {
    // PostImage 엔티티를 직접 사용하여 ImageResponse 리스트 생성
    List<ImageResponse> imageResponses = postImages.stream()
        .map(postImage -> ImageResponse.builder()
            .id(postImage.getId()) // 실제 이미지 ID 사용
            .url(postImage.getImagePath()) // 실제 이미지 경로 사용
            .build())
        .collect(Collectors.toList());

    String authorName;
    try {
      if (board.getUser() != null) {
        authorName = board.getUser().getName();
      } else {
        authorName = "탈퇴한 회원";
      }
    } catch (Exception e) {
      // LazyInitializationException이나 기타 예외 발생 시
      authorName = "탈퇴한 회원";
    }

    return BoardResponse.builder()
        .id(board.getId())
        .title(board.getTitle())
        .content(board.getContent())
        .region(board.getBranch().getRegion())
        .author(authorName)
        .images(imageResponses)
        .viewCount(board.getViewCount())
        .createdAt(board.getCreatedAt())
        .modifiedAt(board.getModifiedAt())
        .build();
  }
}