package bon.bon_jujitsu.domain;

import bon.bon_jujitsu.common.Timestamped;
import bon.bon_jujitsu.dto.update.PopupUpdate;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;

@Builder
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Where(clause = "is_deleted = false")
@Table(name = "popups")
public class Popup extends Timestamped {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    // 이미지 관련 필드 (단일 이미지만 지원)
    private String imagePath;              // 실제 서버 저장 경로
    private String originalFileName;       // 사용자가 업로드한 원본 파일명

    private String linkUrl;                // 클릭 시 이동할 URL

    @Column(nullable = false)
    private LocalDateTime startDate;       // 팝업 시작일

    @Column(nullable = false)
    private LocalDateTime endDate;         // 팝업 종료일

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;       // 활성화 여부 (즉시 on/off 가능)

    @Builder.Default
    @Column(nullable = false)
    private Integer displayOrder = 0;      // 표시 순서 (낮을수록 먼저)

    // 사용자가 "더 이상 보지 않기" 선택 시 쿠키 만료 시간(시간 단위)
    @Builder.Default
    @Column(nullable = false)
    private Integer dismissDurationHours = 24; // 기본 24시간

    @Builder.Default
    @Column(nullable = false)
    private boolean isDeleted = false;     // 소프트 삭제

    public void updatePopup(PopupUpdate popupUpdate) {
        popupUpdate.title().ifPresent(title -> {
            if (!title.isBlank()) this.title = title;
        });

        popupUpdate.content().ifPresent(content -> {
            this.content = content;
        });

        popupUpdate.imagePath().ifPresent(imagePath -> {
            this.imagePath = imagePath;
        });

        popupUpdate.originalFileName().ifPresent(originalFileName -> {
            this.originalFileName = originalFileName;
        });

        popupUpdate.linkUrl().ifPresent(linkUrl -> {
            this.linkUrl = linkUrl;
        });

        popupUpdate.startDate().ifPresent(startDate -> {
            this.startDate = startDate;
        });

        popupUpdate.endDate().ifPresent(endDate -> {
            this.endDate = endDate;
        });

        popupUpdate.isActive().ifPresent(isActive -> {
            this.isActive = isActive;
        });

        popupUpdate.displayOrder().ifPresent(displayOrder -> {
            this.displayOrder = displayOrder;
        });

        popupUpdate.dismissDurationHours().ifPresent(dismissDurationHours -> {
            this.dismissDurationHours = dismissDurationHours;
        });
    }

    public void softDelete() {
        this.isDeleted = true;
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }

    // 팝업이 현재 표시되어야 하는지 확인하는 비즈니스 로직
    public boolean shouldDisplay() {
        LocalDateTime now = LocalDateTime.now();
        return this.isActive &&
                !this.isDeleted &&
                now.isAfter(this.startDate) &&
                now.isBefore(this.endDate);
    }
}