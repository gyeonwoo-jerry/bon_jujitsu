package bon.bon_jujitsu.dto.common;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.springframework.http.HttpStatus;

/**
 * [등록/수정]에 사용할 수 있는 Dto
 */
@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Status {

  private int status;
  private String message;

  public static Status createStatusDto(HttpStatus status, String message) {
    return Status.builder()
        .status(status.value())
        .message(message)
        .build();
  }
}

