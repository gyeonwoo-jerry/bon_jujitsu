package bon.bon_jujitsu.dto.response;

public record BranchCheckResponse(
    boolean isDuplicate,
    String message
) {

}
