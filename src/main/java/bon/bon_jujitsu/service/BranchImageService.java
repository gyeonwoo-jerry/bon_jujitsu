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
            String uploadsOriginal = filepath + "branch/original/";  // 원본 저장 폴더
            String uploadsResized = filepath + "branch/resized/";    // 리사이징 저장 폴더

            for (MultipartFile image : images) {
                String originalFileName = image.getOriginalFilename();
                String uuid = UUID.randomUUID().toString().replace("-", "");
                String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

                // 1. 원본 파일 저장
                String originalPath = saveOriginalImage(image, originalFileName, uploadsOriginal, uuid, datePrefix);

                // 2. 리사이징 파일 저장
                byte[] resizedImageData = resizeImage(image);
                String resizedPath = saveResizedImage(resizedImageData, originalFileName, uploadsResized, uuid, datePrefix);

                // 3. DB에 저장 (프론트에서는 resizedPath 사용)
                BranchImage branchImage = BranchImage.builder()
                    .branch(branch)
                    .imagePath(resizedPath)        // 프론트에서 사용할 리사이징된 파일 경로
                    .originalImagePath(originalPath) // 원본 파일 경로 (별도 필드 필요)
                    .originalFileName(originalFileName)
                    .build();

                branchImageRepository.save(branchImage);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private String saveOriginalImage(MultipartFile image, String originalFileName, String uploads, String uuid, String datePrefix) throws IOException {
        // 원본 확장자 유지
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        } else {
            extension = ".jpg";
        }

        String fileName = datePrefix + "_" + uuid + "_original" + extension;
        String filePath = uploads + fileName;

        Path path = Paths.get(filePath);
        Files.createDirectories(path.getParent());
        Files.write(path, image.getBytes()); // 원본 그대로 저장

        return filePath;
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

        switch (extension) {
            case "png":
                return "png";
            case "webp":
                return "webp";
            case "gif":
                return "gif";
            default:
                return "jpg";
        }
    }

    private String saveResizedImage(byte[] imageData, String originalFileName, String uploads, String uuid, String datePrefix) throws IOException {
        // 원본 확장자 유지
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        } else {
            extension = ".jpg";
        }

        String fileName = datePrefix + "_" + uuid + "_resized" + extension;
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
            // 원본과 리사이징 파일 모두 삭제
            deletePhysicalFile(image.getImagePath());           // 리사이징 파일
            deletePhysicalFile(image.getOriginalImagePath());   // 원본 파일
            branchImageRepository.delete(image);
        }

        // 새 이미지 업로드
        if (newImages != null && !newImages.isEmpty()) {
            uploadImage(branch, newImages);
        }
    }

    private void deletePhysicalFile(String filePath) {
        try {
            if (filePath != null) {
                Path path = Paths.get(filePath);
                Files.deleteIfExists(path);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}