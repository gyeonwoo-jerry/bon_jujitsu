package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.ItemImage;
import java.util.List;
import java.util.stream.Collectors;
import lombok.Builder;

@Builder
public record LatestItemResponse(
    Long id,
    String name,
    List<ItemOptionResponse> options,
    int price,
    int sale,
    List<String> images
) {
    public static LatestItemResponse from(Item item) {
        List<ItemOptionResponse> options = item.getItemOptions().stream()
            .map(detail -> new ItemOptionResponse(detail.getId(), detail.getSize(), detail.getColor(), detail.getAmount()))
            .collect(Collectors.toList());

        return LatestItemResponse.builder()
            .id(item.getId())
            .name(item.getName())
            .options(options)
            .price(item.getPrice())
            .sale(item.getSale())
            .images(item.getImages().stream().map(ItemImage::getImagePath).toList())
            .build();
    }
}
