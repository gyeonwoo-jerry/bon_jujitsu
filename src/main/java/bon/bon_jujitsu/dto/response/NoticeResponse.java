package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Notice;
import bon.bon_jujitsu.domain.PostMedia;
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
    String author,
    Long authorId,
    List<MediaResponse> media,
    Long viewCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {

  public static NoticeResponse fromEntity(Notice notice, List<PostMedia> postMedia) {
    // PostMedia 엔티티를 직접 사용하여 MediaResponse 리스트 생성
    List<MediaResponse> mediaResponse = postMedia.stream()
        .map(postImage -> MediaResponse.builder()
            .id(postImage.getId()) // 실제 이미지 ID 사용
            .url(postImage.getFilePath()) // ✅ getImagePath() 사용 (PostMedia에 정의된 메소드)
            .originalFileName(postImage.getOriginalFileName())
            .mediaType(postImage.getMediaType().name())
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
        .media(mediaResponse)
        .viewCount(notice.getViewCount())
        .createdAt(notice.getCreatedAt())
        .modifiedAt(notice.getModifiedAt())
        .build();
  }
}