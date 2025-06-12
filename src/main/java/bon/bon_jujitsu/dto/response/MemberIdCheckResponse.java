package bon.bon_jujitsu.dto.response;

public record MemberIdCheckResponse(
    boolean available,
    String message
) {}
