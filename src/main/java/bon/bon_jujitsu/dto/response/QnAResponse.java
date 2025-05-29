package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.PostImage;
import bon.bon_jujitsu.domain.QnA;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Builder
public record QnAResponse(
        Long id,
        String title,
        String content,
        List<ImageResponse> images,
        Long viewCount,
        LocalDateTime createdAt,
        LocalDateTime modifiedAT
) {

    public static QnAResponse from(QnA qna, List<PostImage> postImages) {
        List<ImageResponse> imageResponses = postImages.stream()
                .map(postImage -> ImageResponse.builder()
                        .id(postImage.getId()) // 실제 이미지 ID 사용
                        .url(postImage.getImagePath()) // 실제 이미지 경로 사용
                        .build())
                .collect(Collectors.toList());

        return QnAResponse.builder()
                .id(qna.getId())
                .title(qna.getTitle())
                .content(qna.getContent())
                .images(imageResponses)
                .viewCount(qna.getViewCount())
                .createdAt(qna.getCreatedAt())
                .modifiedAT(qna.getModifiedAt())
                .build();
    }
}
