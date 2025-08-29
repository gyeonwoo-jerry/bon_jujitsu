package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.request.PopupRequest;
import bon.bon_jujitsu.dto.response.PopupResponse;
import bon.bon_jujitsu.dto.update.PopupUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.PopupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PopupController {

    private final PopupService popupService;

    @PostMapping("/admin/popups")
    public ApiResponse<PopupResponse> createPopup(
            @AuthenticationUserId Long userId,
            @RequestPart("request") @Valid PopupRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        PopupResponse popup = PopupResponse.from(
                popupService.createPopup(userId, request, image)
        );
        return ApiResponse.success("팝업 생성 완료", popup);
    }

    /**
     * 관리자용 - 모든 팝업 조회
     */
    @GetMapping("/admin/popups")
    public ApiResponse<List<PopupResponse>> getAllPopups(
            @AuthenticationUserId Long userId
    ) {
        List<PopupResponse> popups = popupService.getAllPopups().stream()
                .map(PopupResponse::from)
                .collect(Collectors.toList());
        return ApiResponse.success("팝업 목록 조회 성공", popups);
    }

    /**
     * 공개용 - 현재 활성화된 팝업 조회
     */
    @GetMapping("/popups")
    public ApiResponse<List<PopupResponse>> getActivePopups() {
        List<PopupResponse> popups = popupService.getActivePopups().stream()
                .map(PopupResponse::forPublic) // 공개용 응답 (원본 파일명 제외)
                .collect(Collectors.toList());
        return ApiResponse.success("활성 팝업 조회 성공", popups);
    }

    /**
     * 팝업 상세 조회
     */
    @GetMapping("/admin/popups/{popupId}")
    public ApiResponse<PopupResponse> getPopup(
            @AuthenticationUserId Long userId,
            @PathVariable("popupId") Long popupId
    ) {
        PopupResponse popup = PopupResponse.from(popupService.getPopupById(popupId));
        return ApiResponse.success("팝업 조회 성공", popup);
    }

    /**
     * 팝업 수정
     */
    @PatchMapping("/admin/popups/{popupId}")
    public ApiResponse<PopupResponse> updatePopup(
            @AuthenticationUserId Long userId,
            @PathVariable("popupId") Long popupId,
            @RequestPart("update") @Valid PopupUpdate update,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) {
        PopupResponse popup = PopupResponse.from(
                popupService.updatePopup(userId, popupId, update, image)
        );
        return ApiResponse.success("팝업 수정 성공", popup);
    }

    /**
     * 팝업 삭제
     */
    @DeleteMapping("/admin/popups/{popupId}")
    public ApiResponse<Void> deletePopup(
            @AuthenticationUserId Long userId,
            @PathVariable("popupId") Long popupId
    ) {
        popupService.deletePopup(userId, popupId);
        return ApiResponse.success("팝업 삭제 성공", null);
    }

    /**
     * 팝업 활성화/비활성화 토글
     */
    @PatchMapping("/admin/popups/{popupId}/toggle")
    public ApiResponse<Void> togglePopupStatus(
            @AuthenticationUserId Long userId,
            @PathVariable("popupId") Long popupId
    ) {
        popupService.togglePopupStatus(userId, popupId);
        return ApiResponse.success("팝업 상태 변경 성공", null);
    }
}