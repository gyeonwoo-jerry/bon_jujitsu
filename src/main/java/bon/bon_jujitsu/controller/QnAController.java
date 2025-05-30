package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.QnaRequest;
import bon.bon_jujitsu.dto.response.QnAResponse;
import bon.bon_jujitsu.dto.update.GuestQnAUpdate;
import bon.bon_jujitsu.dto.update.QnAUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.QnaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class QnAController {

    private final QnaService qnaService;

    @PostMapping("/qna")
    public ApiResponse<Void> createQnA(
        @Valid @RequestPart("request") QnaRequest request,
        @AuthenticationUserId(required = false) Long userId,
        @RequestPart(value = "images", required = false)List<MultipartFile> images
    ) {
        qnaService.createQna(request, userId, images);
        return ApiResponse.success("QnA 생성 완료", null);
    }

    @GetMapping("/qna")
    public ApiResponse<PageResponse<QnAResponse>> getQnAs(
        @RequestParam(defaultValue = "0", name = "page") int page,
        @RequestParam(defaultValue = "10", name = "size") int size
    ) {
        return ApiResponse.success("QNA 목록 조회 성공", qnaService.getQnAs(page, size));
    }

    @GetMapping("/qna/{qnaId}")
    public ApiResponse<QnAResponse> getQnA(
        @PathVariable("qnaId") Long qnaId,
        HttpServletRequest request
    ) {
        return ApiResponse.success("QNA 조회 성공", qnaService.getQnA(qnaId, request));
    }

    @PatchMapping("/qna/{qnaId}")
    public ApiResponse<Void> updateQnA(
            @Valid @RequestPart("update") QnAUpdate update,
            @AuthenticationUserId(required = false) Long userId,
            @PathVariable("qnaId") Long qnaId,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestPart(value = "keepImageIds", required = false) List<Long> keepImageIds
    ) {
        qnaService.updateQnA(update, userId, qnaId, images, keepImageIds);
        return ApiResponse.success("QNA 수정 성공", null);
    }

    @DeleteMapping("/qna/{qnaId}")
    public ApiResponse<Void> deleteQnA(
            @PathVariable("qnaId") Long qnaId,
            @AuthenticationUserId(required = false) Long userId,
            @RequestParam(value = "guestPassword", required = false) String guestPassword
    ) {
        qnaService.deleteQnA(qnaId, userId, guestPassword);
        return ApiResponse.success("QNA 삭제 성공", null);
    }
}
