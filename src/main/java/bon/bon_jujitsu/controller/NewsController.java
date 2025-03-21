package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.BoardRequest;
import bon.bon_jujitsu.dto.request.NewsRequest;
import bon.bon_jujitsu.dto.response.BoardResponse;
import bon.bon_jujitsu.dto.response.NewsResponse;
import bon.bon_jujitsu.dto.update.BoardUpdate;
import bon.bon_jujitsu.dto.update.NewsUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.NewsService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NewsController {

  private final NewsService newsService;

  @PostMapping("/news")
  public ResponseEntity<Status> createNews(
      @AuthenticationUserId Long id,
      @RequestPart("request") @Valid NewsRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    newsService.createNews(id, request, images);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(Status.createStatusDto(HttpStatus.CREATED, "뉴스 생성 완료"));
  }

  @GetMapping("/news")
  public ResponseEntity<PageResponse<NewsResponse>> getAllNews (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(newsService.getAllNews(page, size));
  }

  @GetMapping("/news/{newsId}")
  public ResponseEntity<NewsResponse> getNews(
      @PathVariable("newsId") Long newsId
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(newsService.getBoard(newsId));
  }

  @PatchMapping("/news/{newsId}")
  public ResponseEntity<Status> updateNews(
      @RequestPart("update") @Valid NewsUpdate update,
      @AuthenticationUserId Long id,
      @PathVariable("newsId") Long newsId,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(newsService.updateNews(update, id, newsId, images));
  }

  @DeleteMapping("/news/{newsId}")
  public ResponseEntity<Status> deleteNews(
      @AuthenticationUserId Long id,
      @PathVariable("newsId") Long newsId
  ) {
    newsService.deleteNews(id, newsId);
    return ResponseEntity.noContent().build();
  }
}
