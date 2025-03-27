package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserImage;
import bon.bon_jujitsu.repository.UserImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class UserImageService {

    @Value("${filepath}")
    private String filepath;

    private final UserImageRepository userImageRepository;

    public void uploadImage(User user, List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return;
        }

        try {
            String uploads = filepath+"user/";

            for (MultipartFile image : images) {
                String originalFileName = image.getOriginalFilename();
                String dbFilePath = saveImage(image, uploads);

                UserImage userImage = UserImage.builder()
                        .user(user)
                        .imagePath(dbFilePath)
                        .originalFileName(originalFileName)
                        .build();

                userImageRepository.save(userImage);
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

    public void updateImages(User user, List<MultipartFile> newImages) {

        if (newImages == null || newImages.isEmpty()) {
            return;
        }
        // 1. 기존 이미지 조회
        List<UserImage> existingImages = userImageRepository.findByUserId(user.getId());

        // 2. 기존 이미지 파일 삭제 및 엔티티 삭제
        for (UserImage existingImage : existingImages) {
            // 물리적 파일 삭제
            deletePhysicalFile(existingImage.getImagePath(), existingImage.getOriginalFileName());
            // 엔티티 삭제
            userImageRepository.delete(existingImage);
        }

        // 3. 새로운 이미지 업로드
        uploadImage(user, newImages);
    }

    private void deletePhysicalFile(String dbDirPath, String originalFileName) {
        try {
            // 기존의 확장자 추출 로직 유지
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            // 디렉토리 경로에서 마지막에 저장된 파일 찾기
            Path dirPath = Paths.get(dbDirPath);

            // 해당 디렉토리에서 날짜_UUID + 확장자 패턴의 파일 찾기
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(dirPath,
                    "*_*" + extension)) {
                for (Path entry : stream) {
                    Files.deleteIfExists(entry);
                    break; // 첫 번째 매칭되는 파일만 삭제
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
