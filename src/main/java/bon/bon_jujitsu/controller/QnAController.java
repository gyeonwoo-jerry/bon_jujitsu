package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.QnaRequest;
import bon.bon_jujitsu.dto.response.QnAResponse;
import bon.bon_jujitsu.service.QnaService;
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
        @RequestPart(value = "images", required = false)List<MultipartFile> images
    ) {
        qnaService.createQna(request, images);
        return ApiResponse.success("QnA 생성 완료", null);
    }

    @GetMapping("/qna")
    public ApiResponse<PageResponse<QnAResponse>> getQnas(
        @RequestParam(defaultValue = "0", name = "page") int page,
        @RequestParam(defaultValue = "10", name = "size") int size
    ) {
        return ApiResponse.success("QNA 목록 조회 성공", qnaService.getQnas(page, size));
    }
}
