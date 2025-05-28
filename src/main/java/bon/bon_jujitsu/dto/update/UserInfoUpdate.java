package bon.bon_jujitsu.dto.update;

import bon.bon_jujitsu.domain.Stripe;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.Optional;

@Builder
public record UserInfoUpdate(
        @NotNull(message = "사용자 ID는 필수입니다")
        Long targetUserId,

        Optional<@Min(value = 0, message = "레벨은 0 이상이어야 합니다") Integer> level,

        Optional<Stripe> stripe
) {

    // 정적 팩토리 메서드들
    public static UserInfoUpdate levelOnly(Long userId, Integer level) {
        return UserInfoUpdate.builder()
                .targetUserId(userId)
                .level(Optional.ofNullable(level))
                .stripe(Optional.empty())
                .build();
    }

    public static UserInfoUpdate stripeOnly(Long userId, Stripe stripe) {
        return UserInfoUpdate.builder()
                .targetUserId(userId)
                .level(Optional.empty())
                .stripe(Optional.ofNullable(stripe))
                .build();
    }

    public static UserInfoUpdate both(Long userId, Integer level, Stripe stripe) {
        return UserInfoUpdate.builder()
                .targetUserId(userId)
                .level(Optional.ofNullable(level))
                .stripe(Optional.ofNullable(stripe))
                .build();
    }
}