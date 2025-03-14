package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.NotNull;

public record ItemRequest(
    @NotNull(message = "상품의 이름을 입력해주세요")
    String name,
    @NotNull(message = "상품의 사이즈를 입력해주세요")
    String size,
    @NotNull(message = "상품의 설명을 입력해주세요")
    String content,
    @NotNull(message = "상품의 가격을 입력해주세요")
    int price,
    int sale,
    @NotNull(message = "상품의 수량을 입력해주세요")
    int amount
) {
}
