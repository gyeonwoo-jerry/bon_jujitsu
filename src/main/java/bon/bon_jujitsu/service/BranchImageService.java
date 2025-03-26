package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchImage;
import bon.bon_jujitsu.repository.BranchImageRepository;
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
public class BranchImageService {

    @Value("${filepath}")
    private String filepath;

    private final BranchImageRepository branchImageRepository;

    public void uploadImage(Branch branch, List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            return;
        }

        try {
            String uploads = filepath+"branch/";

            for (MultipartFile image : images) {
                String dbFilePath = saveImage(image, uploads);

                BranchImage branchImage = BranchImage.builder()
                        .branch(branch)
                        .imagePath(dbFilePath)
                        .build();

                branchImageRepository.save(branchImage);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private String saveImage(MultipartFile image, String uploads) throws IOException {
        String fileName = UUID.randomUUID().toString().replace("-", "") + "_" + image.getOriginalFilename();

        String filePath = uploads + fileName;

        Path path = Paths.get(filePath);
        Files.createDirectories(path.getParent());
        Files.write(path, image.getBytes());

        return filePath;
    }

    public void updateImages(Branch branch, List<MultipartFile> newImages) {

        if (newImages == null || newImages.isEmpty()) {
            return;
        }
        // 1. 기존 이미지 조회
        List<BranchImage> existingImages = branchImageRepository.findByBranchId(branch.getId());

        // 2. 기존 이미지 파일 삭제 및 엔티티 삭제
        for (BranchImage existingImage : existingImages) {
            // 물리적 파일 삭제
            deletePhysicalFile(existingImage.getImagePath());
            // 엔티티 삭제
            branchImageRepository.delete(existingImage);
        }

        // 3. 새로운 이미지 업로드
        uploadImage(branch, newImages);
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
