package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchImage;
import bon.bon_jujitsu.repository.BranchImageRepository;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import net.coobird.thumbnailator.Thumbnails;

import java.io.ByteArrayOutputStream;
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
public class BranchImageService {

    @Value("${filepath}")
    private String filepath;

    private final BranchImageRepository branchImageRepository;

    // 이미지 리사이징 설정
    private static final int MAX_WIDTH = 1200;
    private static final int MAX_HEIGHT = 800;
    private static final double QUALITY = 0.8; // 80% 품질

    public void uploadImage(Branch branch, List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return;
        }

        try {
            String uploads = filepath + "branch/";

            for (MultipartFile image : images) {
                String originalFileName = image.getOriginalFilename();

                // 이미지 리사이징 후 저장
                byte[] resizedImageData = resizeImage(image);
                String dbFilePath = saveResizedImage(resizedImageData, originalFileName, uploads);

                BranchImage branchImage = BranchImage.builder()
                    .branch(branch)
                    .imagePath(dbFilePath)
                    .originalFileName(originalFileName)
                    .build();

                branchImageRepository.save(branchImage);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private byte[] resizeImage(MultipartFile image) throws IOException {
        // 이미지 타입 확인
        String contentType = image.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }

        // 원본 포맷 유지하면서 리사이징
        String originalFileName = image.getOriginalFilename();
        String outputFormat = getOutputFormat(originalFileName);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Thumbnails.of(image.getInputStream())
                .size(MAX_WIDTH, MAX_HEIGHT)
                .outputQuality(QUALITY)
                .outputFormat(outputFormat)
                .toOutputStream(outputStream);

            return outputStream.toByteArray();
        }
    }

    private String getOutputFormat(String originalFileName) {
        if (originalFileName == null) return "jpg";

        String extension = "";
        if (originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf(".") + 1).toLowerCase();
        }

        // 지원하는 포맷인지 확인
        switch (extension) {
            case "png":
                return "png";
            case "webp":
                return "webp";
            case "gif":
                return "gif";
            default:
                return "jpg"; // 기본값
        }
    }

    private String saveResizedImage(byte[] imageData, String originalFileName, String uploads) throws IOException {
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // 원본 확장자 유지
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        } else {
            extension = ".jpg"; // 기본값
        }

        String fileName = datePrefix + "_" + uuid + extension;
        String filePath = uploads + fileName;

        Path path = Paths.get(filePath);
        Files.createDirectories(path.getParent());
        Files.write(path, imageData);

        return filePath;
    }

    public void updateImages(Branch branch, List<MultipartFile> newImages, List<Long> keepImageIds) {
        List<BranchImage> existingImages = branchImageRepository.findByBranchId(branch.getId());

        // 삭제 대상 선별: keepImageIds에 없는 기존 이미지
        List<BranchImage> toDelete = existingImages.stream()
            .filter(img -> keepImageIds == null || !keepImageIds.contains(img.getId()))
            .collect(Collectors.toList());

        for (BranchImage image : toDelete) {
            deletePhysicalFile(image.getImagePath(), image.getOriginalFileName());
            branchImageRepository.delete(image);
        }

        // 새 이미지 업로드
        if (newImages != null && !newImages.isEmpty()) {
            uploadImage(branch, newImages);
        }
    }

    private void deletePhysicalFile(String dbDirPath, String originalFileName) {
        try {
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            Path dirPath = Paths.get(dbDirPath);

            try (DirectoryStream<Path> stream = Files.newDirectoryStream(dirPath,
                "*_*" + extension)) {
                for (Path entry : stream) {
                    Files.deleteIfExists(entry);
                    break;
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}