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
        String authorName,        // 작성자 이름 (회원은 닉네임, 비회원은 입력한 이름)
        boolean isGuestPost,     // 비회원 작성글 여부
        List<ImageResponse> images,
        Long viewCount,
        LocalDateTime createdAt,
        LocalDateTime modifiedAT
) {

    public static QnAResponse from(QnA qna, List<PostImage> postImages) {
        List<ImageResponse> imageResponses = postImages.stream()
                .map(postImage -> ImageResponse.builder()
                        .id(postImage.getId())
                        .url(postImage.getImagePath())
                        .build())
                .collect(Collectors.toList());

        // 작성자 이름 결정
        String authorName;
        boolean isGuestPost = qna.isGuestPost();

        if (isGuestPost) {
            // 비회원 작성글인 경우
            authorName = qna.getGuestName() != null ? qna.getGuestName() : "익명";
        } else {
            // 회원 작성글인 경우
            authorName = qna.getUser().getName(); // 또는 getNickname()
        }

        return QnAResponse.builder()
                .id(qna.getId())
                .title(qna.getTitle())
                .content(qna.getContent())
                .authorName(authorName)
                .isGuestPost(isGuestPost)
                .images(imageResponses)
                .viewCount(qna.getViewCount())
                .createdAt(qna.getCreatedAt())
                .modifiedAT(qna.getModifiedAt())
                .build();
    }
}
