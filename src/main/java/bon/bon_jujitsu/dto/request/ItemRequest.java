package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ItemRequest(
    @NotNull(message = "상품의 이름을 입력해주세요")
    String name,
    @NotEmpty(message = "상품 옵션이 최소 하나 이상 필요합니다.")
    List<ItemOptionRequest> options,
    @NotNull(message = "상품의 설명을 입력해주세요")
    String content,
    @NotNull(message = "상품의 가격을 입력해주세요")
    int price,
    int sale
) {
}
