package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Board;
import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.News;
import bon.bon_jujitsu.domain.NewsImage;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.NewsRequest;
import bon.bon_jujitsu.dto.response.BoardResponse;
import bon.bon_jujitsu.dto.response.NewsResponse;
import bon.bon_jujitsu.dto.update.NewsUpdate;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.NewsRepository;
import bon.bon_jujitsu.repository.UserRepository;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
@RequiredArgsConstructor
public class NewsService {

  private final NewsRepository newsRepository;
  private final UserRepository userRepository;
  private final BranchRepository branchRepository;
  private final NewsImageService newsImageService;

  public void createNews(Long userId, NewsRequest request, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    branchRepository.findById(user.getBranch().getId()).orElseThrow(()->
        new IllegalArgumentException("존재하지 않는 체육관입니다."));

    if (user.getUserRole() != UserRole.OWNER && user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("뉴스는 관장이나 관리자만 작성할 수 있습니다.");
    }

    News news = News.builder()
        .title(request.title())
        .content(request.content())
        .user(user)
        .build();

    newsRepository.save(news);

    newsImageService.uploadImage(news, images);
  }

  @Transactional(readOnly = true)
  public PageResponse<NewsResponse> getAllNews(int page, int size) {
    PageRequest pageRequest = PageRequest.of(page -1, size);

    Page<News> post = newsRepository.findAll(pageRequest);

    Page<NewsResponse> posts = post.map(news-> new NewsResponse(
        news.getId(),
        news.getTitle(),
        news.getContent(),
        news.getUser().getName(),
        news.getImages().stream().map(NewsImage::getImagePath).toList(),
        news.getCreatedAt(),
        news.getModifiedAt()
    ));

    return PageResponse.success(posts, HttpStatus.OK, "뉴스 조회 성공");
  }

  @Transactional(readOnly = true)
  public NewsResponse getNews(Long newsId) {
    News post = newsRepository.findById(newsId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    NewsResponse newsResponse = NewsResponse.fromEntity(post);
    return newsResponse;
  }

  public Status updateNews(NewsUpdate update, Long userId, Long newsId, List<MultipartFile> images) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    News news = newsRepository.findById(newsId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER && user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("뉴스는 관장이나 관리자만 수정 할 수 있습니다.");
    }

    news.updateNews(update);

    newsImageService.updateImages(news, images);

    return Status.builder().status(HttpStatus.OK.value()).message("뉴스 수정 완료").build();
  }


  public void deleteNews(Long userId, Long newsId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    News news = newsRepository.findById(newsId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    if (user.getUserRole() != UserRole.OWNER && user.getUserRole() != UserRole.ADMIN) {
      throw new IllegalArgumentException("뉴스는 관장이나 관리자만 삭제 할 수 있습니다.");
    }

    news.softDelte();
  }
}
