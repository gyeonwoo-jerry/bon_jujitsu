package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.PostMedia;
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
        Long authorId,
        boolean isGuestPost,     // 비회원 작성글 여부
        List<MediaResponse> images,
        Long viewCount,
        boolean hasAnswer,
        LocalDateTime createdAt,
        LocalDateTime modifiedAT
) {

    public static QnAResponse from(QnA qna, List<PostMedia> postMedia, boolean hasAnswer) {
        List<MediaResponse> mediaRespons = postMedia.stream()
                .map(postImage -> MediaResponse.builder()
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
            // 회원 작성글인 경우 - null 체크 추가
            if (qna.getUser() != null && qna.getUser().getName() != null) {
                authorName = qna.getUser().getName();
            } else {
                authorName = "탈퇴한 회원"; // 또는 "알 수 없음"
            }
        }

        Long authorId = !isGuestPost && qna.getUser() != null ? qna.getUser().getId() : null;

        return QnAResponse.builder()
                .id(qna.getId())
                .title(qna.getTitle())
                .content(qna.getContent())
                .authorName(authorName)
                .authorId(authorId)
                .isGuestPost(isGuestPost)
                .images(mediaRespons)
                .viewCount(qna.getViewCount())
                .hasAnswer(hasAnswer)
                .createdAt(qna.getCreatedAt())
                .modifiedAT(qna.getModifiedAt())
                .build();
    }
}
