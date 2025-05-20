package bon.bon_jujitsu.dto.response;

import lombok.Builder;

@Builder
public record ItemImageResponse(
    Long id,
    String url
) {
}
