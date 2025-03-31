package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.News;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.NewsRequest;
import bon.bon_jujitsu.dto.response.NewsResponse;
import bon.bon_jujitsu.dto.update.NewsUpdate;
import bon.bon_jujitsu.repository.NewsRepository;
import bon.bon_jujitsu.repository.PostImageRepository;
import bon.bon_jujitsu.repository.UserRepository;
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

    if (user.getUserRole() != UserRole.OWNER && user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("뉴스는 관장이나 관리자만 작성할 수 있습니다.");
    }

    News news = News.builder()
        .title(request.title())
        .content(request.content())
        .user(user)
        .build();

    newsRepository.save(news);

    postImageService.uploadImage(news.getId(), "news", images);
  }

  @Transactional(readOnly = true)
  public PageResponse<NewsResponse> getAllNews(int page, int size) {
    PageRequest pageRequest = PageRequest.of(page -1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<News> newsPage = newsRepository.findAll(pageRequest);

    Page<NewsResponse> newsResponses = newsPage.map(news -> {
      // PostImage 레포지토리를 사용하여 해당 게시글의 이미지들 조회
      List<String> imagePaths = postImageRepository.findByPostTypeAndPostId("NEWS", news.getId())
              .stream()
              .map(postImage -> {
                // 파일 경로 안전하게 조합
                String path = Optional.ofNullable(postImage.getImagePath()).orElse("");
                return path;
              })
              .collect(Collectors.toList());

      return new NewsResponse(
              news.getId(),
              news.getTitle(),
              news.getContent(),
              news.getUser().getName(),
              imagePaths,
              news.getCreatedAt(),
              news.getModifiedAt()
      );
    });

    return PageResponse.fromPage(newsResponses);
  }

  @Transactional(readOnly = true)
  public NewsResponse getNews(Long newsId) {
    News news = newsRepository.findById(newsId).orElseThrow(()-> new IllegalArgumentException("뉴스를 찾을 수 없습니다."));

    List<String> imagePaths = postImageRepository.findByPostTypeAndPostId("NEWS", news.getId())
            .stream()
            .map(postImage -> {
              // 파일 경로 안전하게 조합
              String path = Optional.ofNullable(postImage.getImagePath()).orElse("");
              return path;
            })
            .toList();

    NewsResponse newsResponse = NewsResponse.fromEntity(news, imagePaths);
    return newsResponse;
  }

  public void updateNews(NewsUpdate update, Long userId, Long newsId, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    News news = newsRepository.findById(newsId).orElseThrow(()-> new IllegalArgumentException("뉴스를 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER && user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("뉴스는 관장이나 관리자만 수정 할 수 있습니다.");
    }

    news.updateNews(update);

    postImageService.updateImages(news.getId(), "news", images);
  }


  public void deleteNews(Long userId, Long newsId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    News news = newsRepository.findById(newsId).orElseThrow(()-> new IllegalArgumentException("뉴스를 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER && user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("뉴스는 관장이나 관리자만 삭제 할 수 있습니다.");
    }

    news.softDelte();
  }
}
