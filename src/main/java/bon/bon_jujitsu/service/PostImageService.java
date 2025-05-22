package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.PostImage;
import bon.bon_jujitsu.domain.PostType;
import bon.bon_jujitsu.repository.PostImageRepository;
import jakarta.transaction.Transactional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
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
@Slf4j
public class PostImageService {

    @Value("${filepath}")
    private String filepath;

    private final PostImageRepository postImageRepository;

    public void uploadImage(Long contentId, PostType postType, List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return;
        }

        try {
            String uploads = filepath + postType.name() + "/" ;

            for (MultipartFile image : images) {
                String originalFileName = image.getOriginalFilename(); // 원본 파일명
                String savedFilePath = saveImage(image, uploads);

                PostImage postImage = PostImage.builder()
                        .postId(contentId)
                        .postType(postType)
                        .imagePath(savedFilePath) // 저장된 경로
                        .originalFileName(originalFileName) // 원본 파일명 저장
                        .build();

                postImageRepository.save(postImage);
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

    public void updateImages(Long postId, PostType postType, List<MultipartFile> newImages, List<Long> keepImageIds) {
        log.info("=== 이미지 업데이트 시작 ===");
        log.info("postId: {}, postType: {}", postId, postType);
        log.info("받은 keepImageIds: {}", keepImageIds);
        log.info("새 이미지 개수: {}", newImages != null ? newImages.size() : 0);

        // 1. 기존 이미지 조회
        List<PostImage> existingImages = postImageRepository.findByPostTypeAndPostId(postType, postId);
        log.info("기존 이미지 개수: {}", existingImages.size());
        log.info("기존 이미지 ID 목록: {}", existingImages.stream().map(PostImage::getId).collect(Collectors.toList()));

        // 2. 삭제 대상 선별: keepImageIds에 없는 기존 이미지
        List<PostImage> toDelete = existingImages.stream()
            .filter(img -> keepImageIds == null || !keepImageIds.contains(img.getId()))
            .collect(Collectors.toList());

        log.info("삭제 대상 이미지 개수: {}", toDelete.size());
        log.info("삭제 대상 이미지 ID 목록: {}", toDelete.stream().map(PostImage::getId).collect(Collectors.toList()));

        // 3. 삭제 대상 이미지 처리
        for (PostImage image : toDelete) {
            log.info("이미지 삭제 시작 - ID: {}, 경로: {}, 원본파일명: {}",
                image.getId(), image.getImagePath(), image.getOriginalFileName());

            // 물리적 파일 삭제
            deletePhysicalFile(image.getImagePath(), image.getOriginalFileName());
            // 엔티티 삭제
            postImageRepository.delete(image);

            log.info("이미지 삭제 완료 - ID: {}", image.getId());
        }

        // 4. 새 이미지 업로드 (있는 경우)
        if (newImages != null && !newImages.isEmpty()) {
            log.info("새 이미지 업로드 시작: {} 개", newImages.size());
            uploadImage(postId, postType, newImages);
            log.info("새 이미지 업로드 완료");
        } else {
            log.info("새 이미지 없음 - 업로드 스킵");
        }

        log.info("=== 이미지 업데이트 완료 ===");
    }

    private void deletePhysicalFile(String dbDirPath, String originalFileName) {
        log.info("물리적 파일 삭제 시작 - dbDirPath: {}, originalFileName: {}", dbDirPath, originalFileName);

        try {
            // 기존의 확장자 추출 로직 유지
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            // 디렉토리 경로에서 마지막에 저장된 파일 찾기
            Path dirPath = Paths.get(dbDirPath);
            log.info("디렉토리 경로: {}", dirPath);

            // 해당 디렉토리에서 날짜_UUID + 확장자 패턴의 파일 찾기
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(dirPath,
                "*_*" + extension)) {
                for (Path entry : stream) {
                    log.info("삭제할 물리적 파일: {}", entry);
                    Files.deleteIfExists(entry);
                    log.info("물리적 파일 삭제 완료: {}", entry);
                    break; // 첫 번째 매칭되는 파일만 삭제
                }
            }
        } catch (IOException e) {
            log.error("물리적 파일 삭제 실패 - dbDirPath: {}, originalFileName: {}", dbDirPath, originalFileName, e);
            e.printStackTrace();
        }
    }
}
