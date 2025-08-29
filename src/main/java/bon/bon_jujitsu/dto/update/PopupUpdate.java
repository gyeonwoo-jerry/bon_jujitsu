package bon.bon_jujitsu.dto.update;

import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;
import java.util.Optional;

public record PopupUpdate(
        Optional<String> title,
        Optional<String> content,
        Optional<String> imagePath,
        Optional<String> originalFileName,
        Optional<String> linkUrl,
        Optional<LocalDateTime> startDate,
        Optional<LocalDateTime> endDate,
        Optional<Boolean> isActive,
        @Min(value = 0, message = "표시 순서는 0 이상이어야 합니다")
        Optional<Integer> displayOrder,
        @Min(value = 1, message = "숨김 시간은 1시간 이상이어야 합니다")
        Optional<Integer> dismissDurationHours
) {

    // 팩토리 메서드 - 모든 파라미터 포함
    public static PopupUpdate of(
            String title,
            String content,
            String imagePath,
            String originalFileName,
            String linkUrl,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Boolean isActive,
            Integer displayOrder,
            Integer dismissDurationHours
    ) {
        return new PopupUpdate(
                Optional.ofNullable(title),
                Optional.ofNullable(content),
                Optional.ofNullable(imagePath),
                Optional.ofNullable(originalFileName),
                Optional.ofNullable(linkUrl),
                Optional.ofNullable(startDate),
                Optional.ofNullable(endDate),
                Optional.ofNullable(isActive),
                Optional.ofNullable(displayOrder),
                Optional.ofNullable(dismissDurationHours)
        );
    }
}