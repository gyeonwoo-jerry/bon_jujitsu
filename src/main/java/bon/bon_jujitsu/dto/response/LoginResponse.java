package bon.bon_jujitsu.dto.response;

public record LoginResponse(
        boolean success,
        String message,
        String token
) {
}
