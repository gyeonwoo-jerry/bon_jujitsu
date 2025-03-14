package bon.bon_jujitsu.dto.response;

public record TokenResponse(
    String accessToken,
    String refreshToken
) {

}
