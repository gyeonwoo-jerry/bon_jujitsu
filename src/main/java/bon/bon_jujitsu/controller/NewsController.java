package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.NewsRequest;
import bon.bon_jujitsu.dto.response.NewsResponse;
import bon.bon_jujitsu.dto.update.NewsUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.NewsService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NewsController {

  private final NewsService newsService;

  @PostMapping("/news")
  public ApiResponse<Void> createNews(
      @AuthenticationUserId Long userId,
      @RequestPart("request") @Valid NewsRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    newsService.createNews(userId, request, images);
    return ApiResponse.success("뉴스 생성 완료", null);
  }

  @GetMapping("/news")
  public ApiResponse<PageResponse<NewsResponse>> getAllNews (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    PageResponse<NewsResponse> newsList = newsService.getAllNews(page, size);
    return ApiResponse.success("뉴스 목록 조회 성공", newsList);
  }

  @GetMapping("/news/{newsId}")
  public ApiResponse<NewsResponse> getNews(
      @PathVariable("newsId") Long newsId
  ) {
    return ApiResponse.success("뉴스 조회 성공", newsService.getNews(newsId));
  }

  @PatchMapping("/news/{newsId}")
  public ApiResponse<Void> updateNews(
      @RequestPart("update") @Valid NewsUpdate update,
      @AuthenticationUserId Long userId,
      @PathVariable("newsId") Long newsId,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    newsService.updateNews(update, userId, newsId, images);
    return ApiResponse.success("뉴스 수정 성공", null);
  }

  @DeleteMapping("/news/{newsId}")
  public ApiResponse<Void> deleteNews(
      @AuthenticationUserId Long userId,
      @PathVariable("newsId") Long newsId
  ) {
    newsService.deleteNews(userId, newsId);
    return ApiResponse.success("뉴스 삭제 성공", null);
  }
}
