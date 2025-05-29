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
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

  public void createBoard(Long userId, BoardRequest request, List<MultipartFile> images, Long branchId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Branch branch = branchRepository.findById(branchId).orElseThrow(()->
        new IllegalArgumentException("존재하지 않는 체육관입니다."));

    boolean isMemberOfBranch = user.getBranchUsers().stream()
        .anyMatch(bu -> bu.getBranch().getId().equals(branchId));

    if (!isMemberOfBranch) {
      throw new IllegalArgumentException("해당 체육관의 회원만 게시글을 작성할 수 있습니다.");
    }

    Board board = Board.builder()
        .title(request.title())
        .content(request.content())
        .branch(branch)
        .user(user)
        .build();

    boardRepository.save(board);

    postImageService.uploadImage(board.getId(), PostType.BOARD, images);
  }

  @Transactional(readOnly = true)
  public PageResponse<BoardResponse> getBoards(int page, int size, String name, Long branchId) {
    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<Board> boards;

    try {
      // 🔥 방법 1: 수정된 Specification 사용
      Specification<Board> spec = Specification.where(BoardSpecification.includeDeletedUsers())
              .and(BoardSpecification.hasUserName(name))
              .and(BoardSpecification.hasBranchId(branchId));

      boards = boardRepository.findAll(spec, pageRequest);

    } catch (Exception e) {
      // 🔥 방법 2: Specification 실패 시 안전한 쿼리로 폴백
      log.warn("Specification 조회 실패, 안전한 쿼리로 폴백: {}", e.getMessage());
      boards = boardRepository.findBoardsSafely(name, branchId, pageRequest);
    }

    Page<BoardResponse> boardResponses = boards.map(board -> {
      try {
        List<PostImage> postImages = postImageRepository.findByPostTypeAndPostId(PostType.BOARD, board.getId());
        return BoardResponse.fromEntity(board, postImages);
      } catch (Exception e) {
        // 🔥 개별 게시글 처리 실패 시 안전한 응답 생성
        log.warn("게시글 {} 처리 중 오류: {}", board.getId(), e.getMessage());
        return createSafeBoardResponse(board);
      }
    });

    return PageResponse.fromPage(boardResponses);
  }

  @Transactional(readOnly = true)
  public BoardResponse getBoard(Long boardId, HttpServletRequest request) {
    Board board;

    try {
      // 🔥 방법 1: 기본 조회 시도
      board = boardRepository.findById(boardId)
              .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
    } catch (Exception e) {
      // 🔥 방법 2: 안전한 조회로 폴백
      log.warn("기본 조회 실패, 안전한 조회로 폴백: {}", e.getMessage());
      board = boardRepository.findByIdSafely(boardId)
              .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
    }

    HttpSession session = request.getSession();
    String sessionKey = "viewed_board_" + boardId;

    if (session.getAttribute(sessionKey) == null) {
      board.increaseViewCount();
      session.setAttribute(sessionKey, true);
      session.setMaxInactiveInterval(60 * 60);
    }

    try {
      List<PostImage> postImages = postImageRepository.findByPostTypeAndPostId(PostType.BOARD, board.getId());
      return BoardResponse.fromEntity(board, postImages);
    } catch (Exception e) {
      // 🔥 BoardResponse 생성 실패 시 안전한 응답
      log.warn("BoardResponse 생성 실패: {}", e.getMessage());
      return createSafeBoardResponse(board);
    }
  }

  // 🔥 안전한 BoardResponse 생성 헬퍼 메서드
  private BoardResponse createSafeBoardResponse(Board board) {
    List<ImageResponse> emptyImages = Collections.emptyList();

    String authorName;
    try {
      authorName = (board.getUser() != null) ? board.getUser().getName() : "탈퇴한 회원";
    } catch (Exception e) {
      authorName = "탈퇴한 회원";
    }

    String region;
    try {
      region = board.getBranch().getRegion();
    } catch (Exception e) {
      region = "지부 정보 없음";
    }

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

  public void updateBoard(BoardUpdate request, Long userId, Long boardId, List<MultipartFile> images, List<Long> keepImageIds) {
    userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Board board = boardRepository.findById(boardId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    if (!board.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("게시글 수정 권한이 없습니다.");
    }

    board.updateBoard(request);

    postImageService.updateImages(board.getId(), PostType.BOARD, images, keepImageIds);
  }

  public void deleteBoard(Long userId, Long boardId) {
    User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Board board = boardRepository.findById(boardId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    if (!user.isAdmin() && !board.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("삭제 권한이 없습니다.");
    }

    board.softDelete();
  }
}
