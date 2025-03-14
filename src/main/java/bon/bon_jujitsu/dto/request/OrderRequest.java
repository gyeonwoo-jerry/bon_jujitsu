package bon.bon_jujitsu.dto.request;

import bon.bon_jujitsu.domain.PayType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.Collections;
import java.util.List;

public record OrderRequest(
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

    @NotEmpty(message = "장바구니에 최소 한 개의 상품이 있어야 합니다.")
    List<Long> cartItemIds
) {
    public List<Long> cartItemIds() {
        return cartItemIds != null ? cartItemIds : Collections.emptyList();
    }
}
