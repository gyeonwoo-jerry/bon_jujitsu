package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Notice;
import bon.bon_jujitsu.domain.PostImage;
import java.util.stream.Collectors;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record NoticeResponse(
    Long id,
    String title,
    String content,
    String region,
    String author,        // name -> author로 필드명 변경 (BoardResponse와 일치)
    Long authorId,        // String -> Long으로 타입 변경
    List<ImageResponse> images,
    Long viewCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt  // modifiedAT -> modifiedAt으로 오타 수정
) {

  public static NoticeResponse fromEntity(Notice notice, List<PostImage> postImages) {
    // PostImage 엔티티를 직접 사용하여 ImageResponse 리스트 생성
    List<ImageResponse> imageResponses = postImages.stream()
        .map(postImage -> ImageResponse.builder()
            .id(postImage.getId()) // 실제 이미지 ID 사용
            .url(postImage.getImagePath()) // 실제 이미지 경로 사용
            .build())
        .collect(Collectors.toList());

    String authorName;
    try {
      if (notice.getUser() != null) {
        authorName = notice.getUser().getName();
      } else {
        authorName = "탈퇴한 회원";
      }
    } catch (Exception e) {
      authorName = "탈퇴한 회원";
    }

    Long authorId = null;
    try {
      if (notice.getUser() != null) {
        authorId = notice.getUser().getId();
      }
    } catch (Exception e) {
      authorId = null;
    }

    String region;
    try {
      region = notice.getBranch() != null ? notice.getBranch().getRegion() : "지부 정보 없음";
    } catch (Exception e) {
      region = "지부 정보 없음";
    }

    return NoticeResponse.builder()
        .id(notice.getId())
        .title(notice.getTitle())
        .content(notice.getContent())
        .region(region)
        .author(authorName)     // name -> author로 변경
        .authorId(authorId)     // 추가된 필드
        .images(imageResponses)
        .viewCount(notice.getViewCount())
        .createdAt(notice.getCreatedAt())
        .modifiedAt(notice.getModifiedAt())
        .build();
  }
}