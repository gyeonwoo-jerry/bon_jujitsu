package bon.bon_jujitsu.dto.update;

import java.util.Optional;

public record QnAUpdate(
        Optional<String> title,
        Optional<String> content,
        Optional<String> guestPassword // 비회원용
) {
    // 기본 생성자에서 빈 Optional로 초기화
    public QnAUpdate() {
        this(Optional.empty(), Optional.empty(), Optional.empty());
    }

    public boolean hasGuestPassword() {
        return guestPassword.isPresent() && !guestPassword.get().trim().isEmpty();
    }

    public boolean hasContentToUpdate() {
        return title.isPresent() || content.isPresent();
    }
}