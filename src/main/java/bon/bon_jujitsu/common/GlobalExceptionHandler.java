package bon.bon_jujitsu.common;


import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.HttpStatus;
import bon.bon_jujitsu.dto.common.ApiResponse;
import org.springframework.web.bind.annotation.ResponseStatus;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(IllegalArgumentException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ApiResponse<String> handleIllegalArgumentException(IllegalArgumentException ex) {
      log.error("GlobalExceptionHandler  IllegalArgumentException: {}", ex.getMessage());
      return ApiResponse.error(ex.getMessage(), null);
  }

  @ExceptionHandler(RuntimeException.class)
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public ApiResponse<String> handleRuntimeException(RuntimeException ex) {
      return ApiResponse.error("서버 내부 오류가 발생했습니다.", null);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ApiResponse<String> handleValidationExceptions(MethodArgumentNotValidException ex) {
    return ApiResponse.error(ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getDefaultMessage())
            .findFirst()
            .orElse("잘못된 요청입니다."), null);
  }
}
