package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.EditorImageService;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/editor")
@RequiredArgsConstructor
@Slf4j
public class EditorController {

  private final EditorImageService editorImageService;

  @PostMapping("/upload-image")
  public ResponseEntity<?> uploadImage(
      @RequestParam("upload") MultipartFile file,
      @AuthenticationUserId Long userId) {

    try {
      String imageUrl = editorImageService.uploadImage(file);

      // CKEditor 응답 형식
      Map<String, Object> response = new HashMap<>();
      response.put("uploaded", true);
      response.put("url", imageUrl);

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("CKEditor 이미지 업로드 실패", e);

      Map<String, Object> errorResponse = new HashMap<>();
      errorResponse.put("uploaded", false);
      errorResponse.put("error", Map.of("message", e.getMessage()));

      return ResponseEntity.badRequest().body(errorResponse);
    }
  }
}
