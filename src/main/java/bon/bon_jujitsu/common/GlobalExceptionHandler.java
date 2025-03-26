package bon.bon_jujitsu.common;

import java.util.HashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
    Map<String, Object> response = new HashMap<>();
    response.put("success", false);
    response.put("message", ex.getMessage());

    return ResponseEntity.ok(response);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
    Map<String, Object> response = new HashMap<>();
    response.put("success", false);

    // 첫 번째 오류 메시지만 가져오기
    String errorMessage = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getDefaultMessage())
            .findFirst()
            .orElse("잘못된 요청입니다.");

    response.put("message", errorMessage);

    return ResponseEntity.badRequest().body(response);
  }
}
