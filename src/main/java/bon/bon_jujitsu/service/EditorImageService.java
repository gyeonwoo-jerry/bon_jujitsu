package bon.bon_jujitsu.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class EditorImageService {

  @Value("${filepath}")
  private String filepath;

  @Value("${app.base-url}")
  private String baseUrl;

  // 허용되는 이미지 확장자
  private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
      "jpg", "jpeg", "png", "gif", "bmp", "webp"
  );

  // 최대 파일 크기 (5MB)
  private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

  public String uploadImage(MultipartFile file) {
    validateFile(file);

    try {
      String uploadDir = filepath + "editor/images/";
      String fileName = generateFileName(file.getOriginalFilename());
      String filePath = uploadDir + fileName;

      // 디렉토리 생성
      Path uploadPath = Paths.get(uploadDir);
      Files.createDirectories(uploadPath);

      // 파일 저장
      Files.write(Paths.get(filePath), file.getBytes());

      // ✅ 수정: baseUrl 사용
      String imageUrl = baseUrl + "/uploads/editor/images/" + fileName;

      log.info("CKEditor 이미지 업로드 완료: {}", imageUrl);
      return imageUrl;

    } catch (IOException e) {
      log.error("이미지 업로드 실패", e);
      throw new RuntimeException("이미지 업로드에 실패했습니다.", e);
    }
  }

  private void validateFile(MultipartFile file) {
    if (file.isEmpty()) {
      throw new IllegalArgumentException("빈 파일은 업로드할 수 없습니다.");
    }

    if (file.getSize() > MAX_FILE_SIZE) {
      throw new IllegalArgumentException("파일 크기는 5MB를 초과할 수 없습니다.");
    }

    String originalFileName = file.getOriginalFilename();
    if (originalFileName == null || !originalFileName.contains(".")) {
      throw new IllegalArgumentException("올바르지 않은 파일명입니다.");
    }

    String extension = originalFileName.substring(originalFileName.lastIndexOf(".") + 1).toLowerCase();
    if (!ALLOWED_EXTENSIONS.contains(extension)) {
      throw new IllegalArgumentException("지원되지 않는 파일 형식입니다. 지원 형식: " +
          String.join(", ", ALLOWED_EXTENSIONS));
    }
  }

  private String generateFileName(String originalFileName) {
    String extension = "";
    if (originalFileName != null && originalFileName.contains(".")) {
      extension = originalFileName.substring(originalFileName.lastIndexOf("."));
    }

    String uuid = UUID.randomUUID().toString().replace("-", "");
    String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

    return datePrefix + "_" + uuid + extension;
  }
}