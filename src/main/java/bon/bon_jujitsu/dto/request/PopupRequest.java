package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;

public record PopupRequest(
        @NotBlank(message = "팝업 제목을 입력해주세요")
        String title,

        String content,

        String linkUrl,

        @NotNull(message = "시작일을 입력해주세요")
        LocalDateTime startDate,

        @NotNull(message = "종료일을 입력해주세요")
        LocalDateTime endDate,

        Boolean isActive,

        @Min(value = 0, message = "표시 순서는 0 이상이어야 합니다")
        Integer displayOrder,

        @Min(value = 1, message = "숨김 시간은 1시간 이상이어야 합니다")
        Integer dismissDurationHours
) {
    // 기본값 설정을 위한 생성자
    public PopupRequest {
        if (isActive == null) isActive = true;
        if (displayOrder == null) displayOrder = 0;
        if (dismissDurationHours == null) dismissDurationHours = 24;
    }
}