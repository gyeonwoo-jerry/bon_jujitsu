package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Order;
import bon.bon_jujitsu.domain.OrderImage;
import bon.bon_jujitsu.repository.OrderImageRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderImageService {
  @Value("${filepath}")
  private String filepath;  // 현재 활성화된 프로파일을 가져옵니다.

  private final OrderImageRepository orderImageRepository;

  public void uploadImage(Order order, List<MultipartFile> images) {
    if (images == null || images.isEmpty()) {
      return;
    }

    try {
      String uploads = filepath+"item/";

      for (MultipartFile image : images) {
        String dbFilePath = saveImage(image, uploads);
        String originalFileName = image.getOriginalFilename();

        OrderImage orderImage = OrderImage.builder()
            .order(order)
            .imagePath(dbFilePath)
            .originalFileName(originalFileName)
            .build();

        orderImageRepository.save(orderImage);
      }
    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  private String saveImage(MultipartFile image, String uploads) throws IOException {
    String originalFileName = image.getOriginalFilename();
    String uuid = UUID.randomUUID().toString().replace("-", "");
    String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")); // "20250326"

    // 확장자 추출
    String extension = "";
    if (originalFileName != null && originalFileName.contains(".")) {
      extension = originalFileName.substring(originalFileName.lastIndexOf("."));
    }

    String fileName = datePrefix + "_" + uuid + extension; // UUID 뒤에 확장자만 붙임

    String filePath = uploads + fileName; // 실제 저장 경로

    Path path = Paths.get(filePath);
    Files.createDirectories(path.getParent()); // 디렉토리 생성
    Files.write(path, image.getBytes()); // 파일 저장

    return filePath; // DB에 저장할 파일 경로 반환
  }
}
