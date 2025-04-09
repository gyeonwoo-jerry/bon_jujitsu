package bon.bon_jujitsu.dto.response;

public record LogoutResponse(
    Long userId,
    String message
) {
}
