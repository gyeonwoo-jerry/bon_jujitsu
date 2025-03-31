package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.response.LatestItemResponse;
import bon.bon_jujitsu.dto.response.NoticeResponse;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.ItemService;
import bon.bon_jujitsu.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LatestController {

    private final NoticeService noticeService;
    private final ItemService itemService;

    @GetMapping("/notice/main/{branchId}")
    public ApiResponse<NoticeResponse> getMainNotice(
            @PathVariable("branchId") Long branchId
    ) {
        return ApiResponse.success("지부 공지사항 조회 완료", noticeService.getMainNotice(branchId));
    }

    @GetMapping("/items/main")
    public ApiResponse<PageResponse<LatestItemResponse>> getMainItems(
            @RequestParam(defaultValue = "0", name = "page") int page,
            @RequestParam(defaultValue = "10", name = "size") int size,
            @AuthenticationUserId Long userId
    ) {
        PageResponse<LatestItemResponse> itemList = itemService.getMainItems(page, size, userId);
        return ApiResponse.success("상품 목록 조회 성공", itemList);
    }
}
