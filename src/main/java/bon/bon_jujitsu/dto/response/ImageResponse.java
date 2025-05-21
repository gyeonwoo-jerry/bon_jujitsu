package bon.bon_jujitsu.dto.response;

import lombok.Builder;

@Builder
public record ImageResponse(
    Long id,
    String url
) {
}
