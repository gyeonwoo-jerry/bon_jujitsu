package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Item;
import lombok.Builder;

@Builder
public record LatestItemResponse(
        String name,
        String content,
        int price,
        Long itemId
) {

    public static LatestItemResponse from(Item item) {
        return LatestItemResponse.builder()
                .name(item.getName())
                .content(item.getContent())
                .price(item.getPrice())
                .itemId(item.getId())
                .build();
    }
}
