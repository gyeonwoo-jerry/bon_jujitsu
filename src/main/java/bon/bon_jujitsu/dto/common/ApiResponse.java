package bon.bon_jujitsu.dto.common;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T content;

    public static <T> ApiResponse<T> success(String message, T content) {
        return new ApiResponse<>(true, message, content);
    }

    public static <T> ApiResponse<T> error(String message, T content) {
        return new ApiResponse<>(false, message, content);
    }
}