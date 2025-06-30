package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.News;
import bon.bon_jujitsu.domain.PostImage;
import bon.bon_jujitsu.domain.PostType;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.NewsRequest;
import bon.bon_jujitsu.dto.response.ImageResponse;
import bon.bon_jujitsu.dto.response.NewsResponse;
import bon.bon_jujitsu.dto.update.NewsUpdate;
import bon.bon_jujitsu.repository.NewsRepository;
import bon.bon_jujitsu.repository.PostImageRepository;
import bon.bon_jujitsu.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
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

  public void createNews(Long userId, NewsRequest request, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getBranchUsers().stream()
        .anyMatch(bu -> bu.getUserRole() == UserRole.OWNER) && !user.isAdmin()) {
      throw new IllegalArgumentException("뉴스는 관장이나 관리자만 작성할 수 있습니다.");
    }

    News news = News.builder()
        .title(request.title())
        .content(request.content())
        .user(user)
        .build();

    newsRepository.save(news);

    postImageService.uploadImage(news.getId(), PostType.NEWS, images);
  }

  @Transactional(readOnly = true)
  public PageResponse<NewsResponse> getAllNews(int page, int size, String name) {
    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<News> newsPage;

    if (name != null && !name.isBlank()) {
      // 작성자 이름으로 필터링
      newsPage = newsRepository.findByUser_NameContainingIgnoreCase(name, pageRequest);
    } else {
      // 전체 뉴스 조회
      newsPage = newsRepository.findAll(pageRequest);
    }

    Page<NewsResponse> newsResponses = newsPage.map(news -> {
      List<PostImage> postImages = postImageRepository.findByPostTypeAndPostId(PostType.NEWS, news.getId());
      return NewsResponse.fromEntity(news, postImages);
    });

    return PageResponse.fromPage(newsResponses);
  }

  public NewsResponse getNews(Long newsId, HttpServletRequest request) {
    News news = newsRepository.findById(newsId).orElseThrow(()-> new IllegalArgumentException("뉴스를 찾을 수 없습니다."));

    HttpSession session = request.getSession();
    String sessionKey = "viewed_news_" + newsId;

    if (session.getAttribute(sessionKey) == null) {
      news.increaseViewCount(); // 처음 본 경우에만 조회수 증가
      session.setAttribute(sessionKey, true);
      session.setMaxInactiveInterval(60 * 60); // 1시간 유지
    }

    // PostImage 엔티티 리스트를 직접 가져옴
    List<PostImage> postImages = postImageRepository.findByPostTypeAndPostId(PostType.NEWS, news.getId());

    return NewsResponse.fromEntity(news, postImages);
  }

  public void updateNews(NewsUpdate update, Long userId, Long newsId, List<MultipartFile> images, List<Long> keepImageIds) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    News news = newsRepository.findById(newsId).orElseThrow(()-> new IllegalArgumentException("뉴스를 찾을 수 없습니다."));

    if (user.getBranchUsers().stream()
        .anyMatch(bu -> bu.getUserRole() == UserRole.OWNER) && !user.isAdmin()) {
      throw new IllegalArgumentException("뉴스는 관장이나 관리자만 수정할 수 있습니다.");
    }

    if (!news.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 뉴스만 수정할 수 있습니다.");
    }

    news.updateNews(update);

    postImageService.updateImages(news.getId(), PostType.NEWS, images, keepImageIds);
  }


  public void deleteNews(Long userId, Long newsId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    News news = newsRepository.findById(newsId).orElseThrow(()-> new IllegalArgumentException("뉴스를 찾을 수 없습니다."));

    if (user.getBranchUsers().stream()
        .anyMatch(bu -> bu.getUserRole() == UserRole.OWNER) && !user.isAdmin()) {
      throw new IllegalArgumentException("뉴스는 관장이나 관리자만 삭제할 수 있습니다.");
    }

    if (!news.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("본인이 작성한 뉴스만 삭제할 수 있습니다.");
    }

    news.softDelete();
  }
}
