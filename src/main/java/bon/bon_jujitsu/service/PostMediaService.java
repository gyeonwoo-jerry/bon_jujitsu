package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.PostMedia;
import bon.bon_jujitsu.domain.PostMedia.MediaType;
import bon.bon_jujitsu.domain.PostType;
import bon.bon_jujitsu.repository.PostMediaRepository;
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
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class PostMediaService {

    @Value("${filepath}")
    private String filepath;

    private final PostMediaRepository postMediaRepository;

    // 허용되는 이미지 확장자
    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(
        "jpg", "jpeg", "png", "gif", "bmp", "webp"
    );

    // 허용되는 동영상 확장자
    private static final Set<String> ALLOWED_VIDEO_EXTENSIONS = Set.of(
        "mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "m4v"
    );

    // 최대 파일 크기 설정 (이미지: 10MB, 동영상: 100MB)
    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    private static final long MAX_VIDEO_SIZE = 100 * 1024 * 1024;

    public void uploadMedia(Long contentId, PostType postType, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return;
        }

        try {
            String uploads = filepath + postType.name() + "/";

            for (MultipartFile file : files) {
                // 파일 유효성 검사
                validateFile(file);

                String originalFileName = file.getOriginalFilename();
                MediaType mediaType = determineMediaType(originalFileName);
                String savedFilePath = saveFile(file, uploads, mediaType);

                PostMedia postMedia = PostMedia.builder()
                    .postId(contentId)
                    .postType(postType)
                    .filePath(savedFilePath)
                    .originalFileName(originalFileName)
                    .mediaType(mediaType)
                    .build();

                postMediaRepository.save(postMedia);
            }
        } catch (IOException e) {
            log.error("파일 업로드 실패", e);
            throw new RuntimeException("파일 업로드에 실패했습니다.", e);
        }
    }

    private String saveFile(MultipartFile file, String uploads, MediaType mediaType) throws IOException {
        String originalFileName = file.getOriginalFilename();
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // 확장자 추출
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }

        // 미디어 타입별 하위 디렉토리 생성
        String subdirectory = mediaType == MediaType.VIDEO ? "videos/" : "images/";
        String fileName = datePrefix + "_" + uuid + extension;
        String filePath = uploads + subdirectory + fileName;

        Path path = Paths.get(filePath);
        Files.createDirectories(path.getParent());
        Files.write(path, file.getBytes());

        return filePath;
    }

    public void updateMedia(Long postId, PostType postType, List<MultipartFile> newFiles, List<Long> keepMediaIds) {
        log.info("=== 미디어 업데이트 시작 ===");
        log.info("postId: {}, postType: {}", postId, postType);
        log.info("받은 keepMediaIds: {}", keepMediaIds);
        log.info("새 파일 개수: {}", newFiles != null ? newFiles.size() : 0);

        // 1. 기존 미디어 조회
        List<PostMedia> existingMedia = postMediaRepository.findByPostTypeAndPostId(postType, postId);
        log.info("기존 미디어 개수: {}", existingMedia.size());
        log.info("기존 미디어 ID 목록: {}", existingMedia.stream().map(PostMedia::getId).collect(Collectors.toList()));

        // 2. 삭제 대상 선별: keepMediaIds에 없는 기존 미디어
        List<PostMedia> toDelete = existingMedia.stream()
            .filter(media -> keepMediaIds == null || !keepMediaIds.contains(media.getId()))
            .collect(Collectors.toList());

        log.info("삭제 대상 미디어 개수: {}", toDelete.size());
        log.info("삭제 대상 미디어 ID 목록: {}", toDelete.stream().map(PostMedia::getId).collect(Collectors.toList()));

        // 3. 삭제 대상 미디어 처리
        for (PostMedia media : toDelete) {
            log.info("미디어 삭제 시작 - ID: {}, 경로: {}, 원본파일명: {}, 타입: {}",
                media.getId(), media.getFilePath(), media.getOriginalFileName(), media.getMediaType());

            // 물리적 파일 삭제
            deletePhysicalFile(media.getFilePath(), media.getOriginalFileName());
            // 엔티티 삭제
            postMediaRepository.delete(media);

            log.info("미디어 삭제 완료 - ID: {}", media.getId());
        }

        // 4. 새 미디어 업로드 (있는 경우)
        if (newFiles != null && !newFiles.isEmpty()) {
            log.info("새 미디어 업로드 시작: {} 개", newFiles.size());
            uploadMedia(postId, postType, newFiles);
            log.info("새 미디어 업로드 완료");
        } else {
            log.info("새 미디어 없음 - 업로드 스킵");
        }

        log.info("=== 미디어 업데이트 완료 ===");
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

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("빈 파일은 업로드할 수 없습니다.");
        }

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || !originalFileName.contains(".")) {
            throw new IllegalArgumentException("올바르지 않은 파일명입니다.");
        }

        String extension = originalFileName.substring(originalFileName.lastIndexOf(".") + 1).toLowerCase();
        MediaType mediaType = determineMediaType(originalFileName);

        // 파일 크기 검증
        if (mediaType == MediaType.IMAGE && file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException("이미지 파일 크기는 10MB를 초과할 수 없습니다.");
        } else if (mediaType == MediaType.VIDEO && file.getSize() > MAX_VIDEO_SIZE) {
            throw new IllegalArgumentException("동영상 파일 크기는 100MB를 초과할 수 없습니다.");
        }

        // 확장자 검증
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension) && !ALLOWED_VIDEO_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("지원되지 않는 파일 형식입니다. 지원 형식: " +
                String.join(", ", ALLOWED_IMAGE_EXTENSIONS) + ", " +
                String.join(", ", ALLOWED_VIDEO_EXTENSIONS));
        }
    }

    private MediaType determineMediaType(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            throw new IllegalArgumentException("올바르지 않은 파일명입니다.");
        }

        String extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();

        if (ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            return MediaType.IMAGE;
        } else if (ALLOWED_VIDEO_EXTENSIONS.contains(extension)) {
            return MediaType.VIDEO;
        } else {
            throw new IllegalArgumentException("지원되지 않는 파일 형식입니다.");
        }
    }
}