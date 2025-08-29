package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Popup;
import java.time.LocalDateTime;

public record PopupResponse(
        Long id,
        String title,
        String content,
        String imagePath,
        String originalFileName,
        String linkUrl,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Boolean isActive,
        Integer displayOrder,
        Integer dismissDurationHours,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static PopupResponse from(Popup popup) {
        return new PopupResponse(
                popup.getId(),
                popup.getTitle(),
                popup.getContent(),
                popup.getImagePath(),
                popup.getOriginalFileName(),
                popup.getLinkUrl(),
                popup.getStartDate(),
                popup.getEndDate(),
                popup.getIsActive(),
                popup.getDisplayOrder(),
                popup.getDismissDurationHours(),
                popup.getCreatedAt(),
                popup.getModifiedAt()
        );
    }

    // 공개용 응답 (이미지 경로만 노출)
    public static PopupResponse forPublic(Popup popup) {
        return new PopupResponse(
                popup.getId(),
                popup.getTitle(),
                popup.getContent(),
                popup.getImagePath(),
                null, // 원본 파일명은 공개하지 않음
                popup.getLinkUrl(),
                popup.getStartDate(),
                popup.getEndDate(),
                popup.getIsActive(),
                popup.getDisplayOrder(),
                popup.getDismissDurationHours(),
                popup.getCreatedAt(),
                popup.getModifiedAt()
        );
    }
}