package bon.bon_jujitsu.dto.response;

public record ItemCheckResponse(
    boolean isDuplicate,
    String message
) {

}
