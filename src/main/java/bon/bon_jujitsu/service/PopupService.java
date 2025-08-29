package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Popup;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.dto.request.PopupRequest;
import bon.bon_jujitsu.dto.update.PopupUpdate;
import bon.bon_jujitsu.repository.PopupRepository;
import bon.bon_jujitsu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class PopupService {

    @Value("${filepath}")
    private String filepath;

    private final PopupRepository popupRepository;
    private final UserRepository userRepository;

    /**
     * 팝업 생성
     */
    @CacheEvict(value = {"popups", "activePopups"}, allEntries = true)
    public Popup createPopup(Long userId, PopupRequest request, MultipartFile imageFile) {
        User user = findUserById(userId);
        validateAdminPermission(user);

        Popup.PopupBuilder popupBuilder = Popup.builder()
                .title(request.title())
                .content(request.content())
                .linkUrl(request.linkUrl())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .isActive(request.isActive())
                .displayOrder(request.displayOrder())
                .dismissDurationHours(request.dismissDurationHours());

        // 이미지 파일이 있으면 업로드 처리
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                String imagePath = uploadImage(imageFile);
                popupBuilder.imagePath(imagePath)
                        .originalFileName(imageFile.getOriginalFilename());
            } catch (IOException e) {
                log.error("팝업 이미지 업로드 실패: {}", e.getMessage());
                throw new RuntimeException("이미지 업로드에 실패했습니다.");
            }
        }
        Popup popup = popupBuilder.build();
        return popupRepository.save(popup);
    }

    /**
     * 관리자용 - 모든 팝업 조회
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "popups", key = "'all'")
    public List<Popup> getAllPopups() {
        return popupRepository.findAllByOrderByDisplayOrderAsc();
    }

    /**
     * 공개용 - 현재 활성화된 팝업만 조회
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "activePopups", key = "'current'")
    public List<Popup> getActivePopups() {
        return popupRepository.findActivePopupsInPeriod(LocalDateTime.now());
    }

    /**
     * 팝업 상세 조회
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "popup", key = "#id")
    public Popup getPopupById(Long id) {
        return popupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("팝업을 찾을 수 없습니다. ID: " + id));
    }

    /**
     * 팝업 수정
     */
    @CacheEvict(value = {"popups", "activePopups", "popup"}, allEntries = true)
    public Popup updatePopup(Long userId, Long id, PopupUpdate popupUpdate, MultipartFile imageFile) {
        User user = findUserById(userId);
        validateAdminPermission(user);

        Popup popup = getPopupById(id);

        // 새로운 이미지 파일이 있으면 기존 파일 삭제 후 새 파일 업로드
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                // 기존 이미지 파일 삭제
                if (popup.getImagePath() != null) {
                    deletePhysicalFile(popup.getImagePath());
                }

                // 새 이미지 업로드
                String imagePath = uploadImage(imageFile);

                // PopupUpdate에 이미지 정보 추가
                popupUpdate = PopupUpdate.of(
                        popupUpdate.title().orElse(null),
                        popupUpdate.content().orElse(null),
                        imagePath,
                        imageFile.getOriginalFilename(),
                        popupUpdate.linkUrl().orElse(null),
                        popupUpdate.startDate().orElse(null),
                        popupUpdate.endDate().orElse(null),
                        popupUpdate.isActive().orElse(null),
                        popupUpdate.displayOrder().orElse(null),
                        popupUpdate.dismissDurationHours().orElse(null)
                );
            } catch (IOException e) {
                log.error("팝업 이미지 수정 실패: {}", e.getMessage());
                throw new RuntimeException("이미지 업로드에 실패했습니다.");
            }
        }
        popup.updatePopup(popupUpdate);
        return popup;
    }

    /**
     * 팝업 삭제 (소프트 삭제)
     */
    @CacheEvict(value = {"popups", "activePopups", "popup"}, allEntries = true)
    public void deletePopup(Long userId, Long id) {
        User user = findUserById(userId);
        validateAdminPermission(user);

        Popup popup = getPopupById(id);

        // 물리적 파일 삭제
        if (popup.getImagePath() != null) {
            deletePhysicalFile(popup.getImagePath());
        }

        popup.softDelete();
    }

    /**
     * 팝업 활성화/비활성화 토글
     */
    @CacheEvict(value = {"popups", "activePopups", "popup"}, allEntries = true)
    public void togglePopupStatus(Long userId, Long id) {
        User user = findUserById(userId);
        validateAdminPermission(user);

        Popup popup = getPopupById(id);
        if (popup.getIsActive()) {
            popup.deactivate();
        } else {
            popup.activate();
        }
    }

    // === Private Helper Methods ===

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private void validateAdminPermission(User user) {
        if (!user.isAdmin()) {
            throw new IllegalArgumentException("관리자만 해당 작업이 가능합니다.");
        }
    }

    private String uploadImage(MultipartFile imageFile) throws IOException {
        // 이미지 타입 확인
        String contentType = imageFile.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }

        String originalFileName = imageFile.getOriginalFilename();
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // 확장자 추출
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        } else {
            extension = ".jpg";
        }

        // 파일명 생성: 20240101_uuid_popup.jpg
        String fileName = datePrefix + "_" + uuid + "_popup" + extension;
        String uploadsDir = filepath + "popup/";
        String filePath = uploadsDir + fileName;

        // 디렉토리 생성
        Path path = Paths.get(filePath);
        Files.createDirectories(path.getParent());

        // 파일 저장
        Files.write(path, imageFile.getBytes());

        return filePath;
    }

    private void deletePhysicalFile(String filePath) {
        try {
            if (filePath != null) {
                Path path = Paths.get(filePath);
                Files.deleteIfExists(path);
                log.info("팝업 이미지 파일 삭제 완료: {}", filePath);
            }
        } catch (IOException e) {
            log.warn("팝업 이미지 파일 삭제 실패: {}, error: {}", filePath, e.getMessage());
        }
    }
}