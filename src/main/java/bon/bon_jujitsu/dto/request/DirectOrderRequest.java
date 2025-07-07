package bon.bon_jujitsu.dto.request;

import bon.bon_jujitsu.domain.PayType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record DirectOrderRequest(
    @NotBlank(message = "받으시는 분 이름을 입력해주세요")
    String name,

    @NotBlank(message = "받으시는 분 주소를 입력해주세요")
    String address,

    @Pattern(regexp = "\\d{5,6}", message = "우편번호는 5~6자리 숫자여야 합니다.")
    String zipcode,

    @NotBlank(message = "받으시는 분 상세주소를 입력해주세요")
    String addrDetail,

    @Pattern(regexp = "\\d{10,11}", message = "전화번호는 10~11자리 숫자여야 합니다.")
    String phoneNum,

    String requirement,

    @NotNull(message = "결제방식을 선택해 주세요")
    PayType payType,

    @NotEmpty(message = "주문할 상품이 최소 한 개는 있어야 합니다.")
    List<DirectOrderItem> orderItems
) {

  public record DirectOrderItem(
      @NotNull(message = "상품 ID는 필수입니다.")
      @Positive(message = "상품 ID는 양수여야 합니다.")
      Long itemId,

      @NotNull(message = "상품 옵션 ID는 필수입니다.")
      @Positive(message = "상품 옵션 ID는 양수여야 합니다.")
      Long itemOptionId,

      @NotNull(message = "수량은 필수입니다.")
      @Positive(message = "수량은 1개 이상이어야 합니다.")
      Integer quantity
  ) {}
}