package bon.bon_jujitsu.dto.common;

import java.util.List;
import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

/**
 * 페이징 객체를 반환할때 사용하는 responseDto
 */
@Getter
@SuperBuilder(builderMethodName = "createResponseBuilder")
public class PageResponse<T> extends Status {

  private List<T> data;
  private int page;
  private int size;
  private int totalPage;

  public static <T> PageResponse<T> success(Page<T> data, HttpStatus status, String message) {
    Pageable pageable = data.getPageable();
    return PageResponse.<T>createResponseBuilder()
        .data(data.hasContent() ? data.getContent() : null)
        .status(status.value())
        .message(message)
        .page(createPage(pageable))
        .size(createPageSize(pageable))
        .totalPage(data.getTotalPages())
        .build();
  }

  public static <T> PageResponse<T> create(Page<T> data) {
    Pageable pageable = data.getPageable();
    return PageResponse.<T>createResponseBuilder()
        .data(data.hasContent() ? data.getContent() : null)
        .status(createStatus(data).value())
        .message(createMessage(data))
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

  private static <T> String createMessage(Page<T> data) {
    if(data.isEmpty())
      return "조회 결과가 없습니다.";
    else
      return "조회 성공";
  }

  private static <T> HttpStatus createStatus(Page<T> data) {
    if(data.isEmpty())
      return HttpStatus.NOT_FOUND;
    else
      return HttpStatus.OK;
  }
}
