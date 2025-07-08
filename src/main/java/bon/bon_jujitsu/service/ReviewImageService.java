package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Review;
import bon.bon_jujitsu.domain.ReviewImage;
import bon.bon_jujitsu.repository.ReviewImageRepository;
import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import net.coobird.thumbnailator.Thumbnails;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewImageService {

  @Value("${filepath}")
  private String filepath;

  private final ReviewImageRepository reviewImageRepository;

  // 이미지 리사이징 설정
  private static final int MAX_WIDTH = 1200;
  private static final int MAX_HEIGHT = 800;
  private static final double QUALITY = 0.8;

  public void uploadImage(Review review, List<MultipartFile> images) {
    if (images == null || images.isEmpty()) {
      return;
    }

    try {
      String uploadsOriginal = filepath + "review/original/";
      String uploadsResized = filepath + "review/resized/";

      for (MultipartFile image : images) {
        String originalFileName = image.getOriginalFilename();
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // 1. 원본 파일 저장
        String originalPath = saveOriginalImage(image, originalFileName, uploadsOriginal, uuid, datePrefix);

        // 2. 리사이징 파일 저장
        byte[] resizedImageData = resizeImage(image);
        String resizedPath = saveResizedImage(resizedImageData, originalFileName, uploadsResized, uuid, datePrefix);

        ReviewImage reviewImage = ReviewImage.builder()
            .review(review)
            .imagePath(resizedPath)
            .originalImagePath(originalPath)
            .originalFileName(originalFileName)
            .build();

        reviewImageRepository.save(reviewImage);
      }
    } catch (IOException e) {
      e.printStackTrace();
    }
  }

  private String saveOriginalImage(MultipartFile image, String originalFileName, String uploads, String uuid, String datePrefix) throws IOException {
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
    Files.write(path, image.getBytes());

    return filePath;
  }

  private byte[] resizeImage(MultipartFile image) throws IOException {
    String contentType = image.getContentType();
    if (contentType == null || !contentType.startsWith("image/")) {
      throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
    }

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

  public void updateImages(Review review, List<MultipartFile> newImages, List<Long> keepImageIds) {
    List<ReviewImage> existingImages = reviewImageRepository.findByReviewId(review.getId());

    List<ReviewImage> toDelete = existingImages.stream()
        .filter(img -> keepImageIds == null || !keepImageIds.contains(img.getId()))
        .collect(Collectors.toList());

    for (ReviewImage image : toDelete) {
      deletePhysicalFile(image.getImagePath());
      deletePhysicalFile(image.getOriginalImagePath());
      reviewImageRepository.delete(image);
    }

    if (newImages != null && !newImages.isEmpty()) {
      uploadImage(review, newImages);
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