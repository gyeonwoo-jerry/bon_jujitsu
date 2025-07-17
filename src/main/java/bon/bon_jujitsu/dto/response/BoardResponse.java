package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Board;
import bon.bon_jujitsu.domain.PostMedia;
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
    Long authorId,
    List<MediaResponse> images,
    Long viewCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {

  public static BoardResponse fromEntity(Board board, List<PostMedia> postMedia) {
    // PostMedia 엔티티를 직접 사용하여 MediaResponse 리스트 생성
    List<MediaResponse> mediaRespons = postMedia.stream()
        .map(postImage -> MediaResponse.builder()
            .id(postImage.getId())
            .url(postImage.getFilePath())
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
      authorName = "탈퇴한 회원";
    }

    Long authorId = null;
    try {
      if (board.getUser() != null) {
        authorId = board.getUser().getId();
      }
    } catch (Exception e) {
      authorId = null;
    }

    String region;
    try {
      region = board.getBranch() != null ? board.getBranch().getRegion() : "지부 정보 없음";
    } catch (Exception e) {
      region = "지부 정보 없음";
    }

    return BoardResponse.builder()
        .id(board.getId())
        .title(board.getTitle())
        .content(board.getContent())
        .region(region)
        .author(authorName)
        .authorId(authorId)
        .images(mediaRespons)
        .viewCount(board.getViewCount())
        .createdAt(board.getCreatedAt())
        .modifiedAt(board.getModifiedAt())
        .build();
  }
}