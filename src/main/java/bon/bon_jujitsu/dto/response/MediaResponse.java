package bon.bon_jujitsu.dto.response;

import lombok.Builder;

@Builder
public record MediaResponse(
    Long id,
    String url,
    String originalFileName,
    String mediaType // "IMAGE" 또는 "VIDEO"
) {
}