package bon.bon_jujitsu.dto.common;

import java.util.List;
import lombok.Getter;
import lombok.experimental.SuperBuilder;
import org.springframework.http.HttpStatus;

/**
 * 리스트 형식을 반환할 때 사용하는 responseDto
 */
@Getter
@SuperBuilder(builderMethodName = "createResponseBuilder")
public class ListResponse<T> extends Status {
  private List<T> data;

  public static <T> ListResponse<T> success(List<T> data, HttpStatus status, String message) {
    return ListResponse.<T>createResponseBuilder()
        .data(data)
        .status(createStatus(data).value())
        .message(message)
        .build();
  }

  public static <T> ListResponse<T> create(List<T> data, String message) {
    return ListResponse.<T>createResponseBuilder()
        .data(data)
        .status(createStatus(data).value())
        .message(message)
        .build();
  }

  public static <T> ListResponse<T> create(List<T> data) {
    return ListResponse.<T>createResponseBuilder()
        .data(data)
        .status(createStatus(data).value())
        .message(createMessage(data))
        .build();
  }

  private static <T> HttpStatus createStatus(List<T> data) {
    if(data == null || data.isEmpty())
      return HttpStatus.NOT_FOUND;
    else
      return HttpStatus.OK;
  }

  private static <T> String createMessage(List<T> data) {
    if(data.isEmpty())
      return "조회 결과가 없습니다.";
    else
      return "조회 성공";
  }
}