package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Skill;
import bon.bon_jujitsu.domain.SkillImage;
import bon.bon_jujitsu.repository.SkillImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class SKillImageService {

  @Value("${filepath}")
  private String filepath;

  private final SkillImageRepository skillImageRepository;

  public void uploadImage(Skill skill, List<MultipartFile> images) {
    if (images == null || images.isEmpty()) {
      return;
    }

    try {
      String uploads = filepath+"skill/";

      for (MultipartFile image : images) {
        String dbFilePath = saveImage(image, uploads);

        SkillImage skillImage = SkillImage.builder()
            .skill(skill)
            .imagePath(dbFilePath)
            .build();

        skillImageRepository.save(skillImage);
      }
    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  private String saveImage(MultipartFile image, String uploads) throws IOException {
    String fileName = UUID.randomUUID().toString().replace("-", "") + "_" + image.getOriginalFilename();

    String filePath = uploads + fileName;

    String dbFilepath = filepath + fileName;

    Path path = Paths.get(filePath);
    Files.createDirectories(path.getParent());
    Files.write(path, image.getBytes());

    return dbFilepath;
  }

  public void updateImages(Skill skill, List<MultipartFile> newImages) {

    if (newImages == null || newImages.isEmpty()) {
      return;
    }
    // 1. 기존 이미지 조회
    List<SkillImage> existingImages = skillImageRepository.findBySkillId(skill.getId());

    // 2. 기존 이미지 파일 삭제 및 엔티티 삭제
    for (SkillImage existingImage : existingImages) {
      // 물리적 파일 삭제
      deletePhysicalFile(existingImage.getImagePath());
      // 엔티티 삭제
      skillImageRepository.delete(existingImage);
    }

    // 3. 새로운 이미지 업로드
    uploadImage(skill, newImages);
  }

  private void deletePhysicalFile(String dbFilePath) {
    try {
      // DB에 저장된 경로로부터 실제 파일 경로 계산
      String actualFilePath = dbFilePath;
      Path path = Paths.get(actualFilePath);
      Files.deleteIfExists(path);
    } catch (IOException e) {
      e.printStackTrace();
    }
  }
}
