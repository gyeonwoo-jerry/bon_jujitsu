package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.ItemOption;

public record ItemOptionResponse(
    Long id,
    String size,
    String color,
    int amount
) {
  public static ItemOptionResponse fromEntity(ItemOption option) {
    return new ItemOptionResponse(
        option.getId(),
        option.getSize(),
        option.getColor(),
        option.getAmount()
    );
  }
}