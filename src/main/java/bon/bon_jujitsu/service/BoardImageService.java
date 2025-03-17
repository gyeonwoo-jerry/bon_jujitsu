package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Board;
import bon.bon_jujitsu.domain.BoardImage;
import bon.bon_jujitsu.repository.BoardImageRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
@RequiredArgsConstructor
public class BoardImageService {

  private final BoardImageRepository boardImageRepository;

  public void uploadImage(Board board, List<MultipartFile> images) {
    if (images == null || images.isEmpty()) {
      return;
    }

    try {
      String uploads = "src/main/resources/images/";

      for (MultipartFile image : images) {
        String dbFilePath = saveImage(image, uploads);

        BoardImage boardImage = BoardImage.builder()
            .board(board)
            .imagePath(dbFilePath)
            .build();

        boardImageRepository.save(boardImage);
      }
    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  private String saveImage(MultipartFile image, String uploads) throws IOException {
    String fileName = UUID.randomUUID().toString().replace("-", "") + "_" + image.getOriginalFilename();

    String filePath = uploads + fileName;

    String dbFilepath = "/uploads/images/" + fileName;

    Path path = Paths.get(filePath);
    Files.createDirectories(path.getParent());
    Files.write(path, image.getBytes());

    return dbFilepath;
  }

  public void updateImages(Board board, List<MultipartFile> newImages) {

    if (newImages == null || newImages.isEmpty()) {
      return;
    }
    // 1. 기존 이미지 조회
    List<BoardImage> existingImages = boardImageRepository.findByBoardId(board.getId());

    // 2. 기존 이미지 파일 삭제 및 엔티티 삭제
    for (BoardImage existingImage : existingImages) {
      // 물리적 파일 삭제
      deletePhysicalFile(existingImage.getImagePath());
      // 엔티티 삭제
      boardImageRepository.delete(existingImage);
    }

    // 3. 새로운 이미지 업로드
    uploadImage(board, newImages);
  }

  private void deletePhysicalFile(String dbFilePath) {
    try {
      // DB에 저장된 경로로부터 실제 파일 경로 계산
      String actualFilePath = "src/main/resources" + dbFilePath.replace("/uploads", "");
      Path path = Paths.get(actualFilePath);
      Files.deleteIfExists(path);
    } catch (IOException e) {
      e.printStackTrace();
    }
  }
}