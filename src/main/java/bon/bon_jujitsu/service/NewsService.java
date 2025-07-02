package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.News;
import bon.bon_jujitsu.domain.PostImage;
import bon.bon_jujitsu.domain.PostType;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.NewsRequest;
import bon.bon_jujitsu.dto.response.NewsResponse;
import bon.bon_jujitsu.dto.update.NewsUpdate;
import bon.bon_jujitsu.repository.NewsRepository;
import bon.bon_jujitsu.repository.PostImageRepository;
import bon.bon_jujitsu.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
@RequiredArgsConstructor
public class NewsService {

  private final NewsRepository newsRepository;
  private final UserRepository userRepository;
  private final PostImageService postImageService;
  private final PostImageRepository postImageRepository;

  private static final String VIEWED_NEWS_PREFIX = "viewed_news_";
  private static final int VIEW_SESSION_TIMEOUT = 60 * 60; // 1시간

  @CacheEvict(value = "news", allEntries = true)
  public void createNews(Long userId, NewsRequest request, List<MultipartFile> images) {
    User user = validateUser(userId);
    validateNewsPermission(user);

    News news = News.builder()
        .title(request.title())
        .content(request.content())
        .user(user)
        .build();

    newsRepository.save(news);

    if (images != null && !images.isEmpty()) {
      postImageService.uploadImage(news.getId(), PostType.NEWS, images);
    }
  }

  @Transactional(readOnly = true)
  @Cacheable(value = "news", key = "#page + '_' + #size + '_' + (#name != null ? #name : 'all')")
  public PageResponse<NewsResponse> getAllNews(int page, int size, String name) {
    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    // N+1 문제 방지를 위한 fetch join 사용
    Page<News> newsPage = (name != null && !name.isBlank())
        ? newsRepository.findByUserNameContainingIgnoreCaseWithFetch(name, pageRequest)
        : newsRepository.findAllWithFetch(pageRequest);

    // 이미지만 별도로 배치 로딩 (OneToMany 관계는 별도 처리가 효율적)
    Set<Long> newsIds = newsPage.getContent().stream()
        .map(News::getId)
        .collect(Collectors.toSet());

    Map<Long, List<PostImage>> imageMap = loadImagesInBatch(newsIds);

    // NewsResponse 생성
    return PageResponse.fromPage(newsPage.map(news -> {
      List<PostImage> images = imageMap.getOrDefault(news.getId(), Collections.emptyList());
      return NewsResponse.fromEntity(news, images);
    }));
  }

  @Cacheable(value = "news", key = "#newsId")
  public NewsResponse getNews(Long newsId, HttpServletRequest request) {
    // N+1 문제 방지를 위한 fetch join 사용
    News news = newsRepository.findByIdWithFetch(newsId)
        .orElseThrow(() -> new IllegalArgumentException("뉴스를 찾을 수 없습니다."));

    // 세션 기반 조회수 증가 처리
    handleViewCountIncrease(news, newsId, request);

    // 이미지 조회
    List<PostImage> postImages = postImageRepository.findByPostTypeAndPostId(PostType.NEWS, news.getId());

    return NewsResponse.fromEntity(news, postImages);
  }

  @CacheEvict(value = "news", allEntries = true)
  public void updateNews(NewsUpdate update, Long userId, Long newsId,
      List<MultipartFile> images, List<Long> keepImageIds) {
    User user = validateUser(userId);
    News news = validateNews(newsId);

    validateNewsPermission(user);
    validateNewsOwner(user, news);

    news.updateNews(update);

    if (images != null || keepImageIds != null) {
      postImageService.updateImages(news.getId(), PostType.NEWS, images, keepImageIds);
    }
  }

  @CacheEvict(value = "news", allEntries = true)
  public void deleteNews(Long userId, Long newsId) {
    User user = validateUser(userId);
    News news = validateNews(newsId);

    validateNewsPermission(user);
    validateNewsOwner(user, news);

    news.softDelete();
  }

  // === Private Helper Methods ===

  private Map<Long, List<PostImage>> loadImagesInBatch(Set<Long> newsIds) {
    if (newsIds.isEmpty()) {
      return Collections.emptyMap();
    }

    List<PostImage> allImages = postImageRepository.findByPostTypeAndPostIdIn(PostType.NEWS, newsIds);
    return allImages.stream()
        .collect(Collectors.groupingBy(PostImage::getPostId));
  }

  private void handleViewCountIncrease(News news, Long newsId, HttpServletRequest request) {
    HttpSession session = request.getSession();
    String sessionKey = VIEWED_NEWS_PREFIX + newsId;

    if (session.getAttribute(sessionKey) == null) {
      news.increaseViewCount();
      session.setAttribute(sessionKey, true);
      session.setMaxInactiveInterval(VIEW_SESSION_TIMEOUT);
    }
  }

  // 공통 검증 메서드들
  private User validateUser(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));
  }

  private News validateNews(Long newsId) {
    return newsRepository.findById(newsId)
        .orElseThrow(() -> new IllegalArgumentException("뉴스를 찾을 수 없습니다."));
  }

  private void validateNewsPermission(User user) {
    if (!user.isAdmin()) {
      throw new IllegalArgumentException("뉴스는 관리자만 작성할 수 있습니다.");
    }
  }

  private void validateNewsOwner(User user, News news) {
    if (!user.isAdmin() && !news.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 뉴스만 수정/삭제할 수 있습니다.");
    }
  }
}