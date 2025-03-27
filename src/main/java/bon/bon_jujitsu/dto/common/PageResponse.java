package bon.bon_jujitsu.dto.common;

import java.util.List;
import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 페이징 객체를 반환할때 사용하는 responseDto
 */
@Getter
@SuperBuilder(builderMethodName = "createResponseBuilder")
public class PageResponse<T> {

  private List<T> list;
  private int page;
  private int size;
  private int totalPage;
  public static <T> PageResponse<T> fromPage(Page<T> data) {
    Pageable pageable = data.getPageable();
    return PageResponse.<T>createResponseBuilder()
        .list(data.hasContent() ? data.getContent() : null)
        .page(createPage(pageable))
        .size(createPageSize(pageable))
        .totalPage(data.getTotalPages())
        .build();
  }

  private static int createPage(Pageable pageable) {
    return pageable.isPaged() ? pageable.getPageNumber() + 1 : 0;
  }

  private static int createPageSize(Pageable pageable) {
    return pageable.isPaged() ? pageable.getPageSize() : 0;
  }
}
