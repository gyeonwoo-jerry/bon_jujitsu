package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Board;
import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.PostImage;
import bon.bon_jujitsu.domain.PostType;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.BoardRequest;
import bon.bon_jujitsu.dto.response.BoardResponse;
import bon.bon_jujitsu.dto.response.ImageResponse;
import bon.bon_jujitsu.dto.update.BoardUpdate;
import bon.bon_jujitsu.repository.BoardRepository;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.PostImageRepository;
import bon.bon_jujitsu.repository.UserRepository;
import bon.bon_jujitsu.specification.BoardSpecification;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class BoardService {

  private final BoardRepository boardRepository;
  private final BranchRepository branchRepository;
  private final UserRepository userRepository;
  private final PostImageService postImageService;
  private final PostImageRepository postImageRepository;

  private static final String VIEWED_BOARD_PREFIX = "viewed_board_";
  private static final int VIEW_SESSION_TIMEOUT = 60 * 60; // 1시간

  /**
   * 게시글 생성 - 권한 검증 최적화
   */
  @CacheEvict(value = "boards", allEntries = true)
  public void createBoard(Long userId, BoardRequest request, List<MultipartFile> images, Long branchId) {
    // 사용자와 브랜치를 동시에 조회하여 DB 호출 최소화
    User user = findUserById(userId);
    Branch branch = findBranchById(branchId);

    // 권한 검증 최적화 - 스트림 대신 직접 검증
    validateBranchMembership(user, branchId);

    Board board = Board.builder()
        .title(request.title())
        .content(request.content())
        .branch(branch)
        .user(user)
        .build();

    boardRepository.save(board);

    // 비동기 처리 가능한 부분
    if (images != null && !images.isEmpty()) {
      postImageService.uploadImage(board.getId(), PostType.BOARD, images);
    }
  }

  /**
   * 게시글 목록 조회 - 이미지 배치 로딩으로 N+1 문제 해결
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "boards", key = "#page + '_' + #size + '_' + #name + '_' + #branchId")
  public PageResponse<BoardResponse> getBoards(int page, int size, String name, Long branchId) {
    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<Board> boards = findBoardsWithOptimizedQuery(pageRequest, name, branchId);

    // 이미지 배치 로딩으로 N+1 문제 해결
    Set<Long> boardIds = boards.getContent().stream()
        .map(Board::getId)
        .collect(Collectors.toSet());

    Map<Long, List<PostImage>> imageMap = loadImagesInBatch(boardIds);

    Page<BoardResponse> boardResponses = boards.map(board ->
        createBoardResponse(board, imageMap.getOrDefault(board.getId(), Collections.emptyList()))
    );

    return PageResponse.fromPage(boardResponses);
  }

  /**
   * 게시글 상세 조회 - 조회수 증가 최적화
   */
  @Cacheable(value = "board", key = "#boardId")
  public BoardResponse getBoard(Long boardId, HttpServletRequest request) {
    Board board = findBoardByIdWithOptimizedQuery(boardId);

    // 조회수 증가 처리 (별도 트랜잭션으로 분리 고려)
    handleViewCountIncrease(board, boardId, request);

    List<PostImage> postImages = postImageRepository.findByPostTypeAndPostId(PostType.BOARD, board.getId());
    return createBoardResponse(board, postImages);
  }

  /**
   * 게시글 수정 - 권한 검증 최적화
   */
  @CacheEvict(value = {"boards", "board"}, allEntries = true)
  public void updateBoard(BoardUpdate request, Long userId, Long boardId,
      List<MultipartFile> images, List<Long> keepImageIds) {
    User user = findUserById(userId);
    Board board = findBoardById(boardId);

    validateUpdatePermission(user, board);

    board.updateBoard(request);

    if (images != null || keepImageIds != null) {
      postImageService.updateImages(board.getId(), PostType.BOARD, images, keepImageIds);
    }
  }

  /**
   * 게시글 삭제 - 소프트 삭제
   */
  @CacheEvict(value = {"boards", "board"}, allEntries = true)
  public void deleteBoard(Long userId, Long boardId) {
    User user = findUserById(userId);
    Board board = findBoardById(boardId);

    validateDeletePermission(user, board);

    board.softDelete();
  }

  // === Private Helper Methods ===

  private User findUserById(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
  }

  private Branch findBranchById(Long branchId) {
    return branchRepository.findById(branchId)
        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 체육관입니다."));
  }

  private Board findBoardById(Long boardId) {
    return boardRepository.findById(boardId)
        .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
  }

  private void validateBranchMembership(User user, Long branchId) {
    boolean isMember = user.getBranchUsers().stream()
        .anyMatch(bu -> bu.getBranch().getId().equals(branchId));

    if (!isMember) {
      throw new IllegalArgumentException("해당 체육관의 회원만 게시글을 작성할 수 있습니다.");
    }
  }

  private void validateUpdatePermission(User user, Board board) {
    if (!user.isAdmin() && !board.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("게시글 수정 권한이 없습니다.");
    }
  }

  private void validateDeletePermission(User user, Board board) {
    if (!user.isAdmin() && !board.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("삭제 권한이 없습니다.");
    }
  }

  private Page<Board> findBoardsWithOptimizedQuery(PageRequest pageRequest, String name, Long branchId) {
    try {
      Specification<Board> spec = Specification.where(BoardSpecification.includeDeletedUsers())
          .and(BoardSpecification.hasUserName(name))
          .and(BoardSpecification.hasBranchId(branchId));

      return boardRepository.findAll(spec, pageRequest);
    } catch (Exception e) {
      log.warn("Specification 조회 실패, 안전한 쿼리로 폴백: {}", e.getMessage());
      return boardRepository.findBoardsSafely(name, branchId, pageRequest);
    }
  }

  private Board findBoardByIdWithOptimizedQuery(Long boardId) {
    try {
      return boardRepository.findById(boardId)
          .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
    } catch (Exception e) {
      log.warn("기본 조회 실패, 안전한 조회로 폴백: {}", e.getMessage());
      return boardRepository.findByIdSafely(boardId)
          .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
    }
  }

  private Map<Long, List<PostImage>> loadImagesInBatch(Set<Long> boardIds) {
    List<PostImage> allImages = postImageRepository.findByPostTypeAndPostIdIn(PostType.BOARD, boardIds);
    return allImages.stream()
        .collect(Collectors.groupingBy(PostImage::getPostId));
  }

  private void handleViewCountIncrease(Board board, Long boardId, HttpServletRequest request) {
    HttpSession session = request.getSession();
    String sessionKey = VIEWED_BOARD_PREFIX + boardId;

    if (session.getAttribute(sessionKey) == null) {
      // 조회수 증가는 비동기 처리나 별도 트랜잭션 고려
      board.increaseViewCount();
      session.setAttribute(sessionKey, true);
      session.setMaxInactiveInterval(VIEW_SESSION_TIMEOUT);
    }
  }

  private BoardResponse createBoardResponse(Board board, List<PostImage> postImages) {
    try {
      return BoardResponse.fromEntity(board, postImages);
    } catch (Exception e) {
      log.warn("BoardResponse 생성 실패: {}", e.getMessage());
      return createSafeBoardResponse(board);
    }
  }

  private BoardResponse createSafeBoardResponse(Board board) {
    List<ImageResponse> emptyImages = Collections.emptyList();

    String authorName = Optional.ofNullable(board.getUser())
        .map(User::getName)
        .orElse("탈퇴한 회원");

    String region = Optional.ofNullable(board.getBranch())
        .map(Branch::getRegion)
        .orElse("지부 정보 없음");

    return new BoardResponse(
        board.getId(),
        board.getTitle(),
        board.getContent(),
        region,
        authorName,
        emptyImages,
        board.getViewCount(),
        board.getCreatedAt(),
        board.getModifiedAt()
    );
  }
}