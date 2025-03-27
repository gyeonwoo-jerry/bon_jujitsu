package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Board;
import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.BoardRequest;
import bon.bon_jujitsu.dto.response.BoardResponse;
import bon.bon_jujitsu.dto.update.BoardUpdate;
import bon.bon_jujitsu.repository.BoardRepository;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.PostImageRepository;
import bon.bon_jujitsu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
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

    if (!user.getBranch().equals(branch)) {
      throw new IllegalArgumentException("해당 체육관의 회원만 게시글을 작성할 수 있습니다.");
    }

    Board board = Board.builder()
        .title(request.title())
        .content(request.content())
        .branch(branch)
        .user(user)
        .build();

    boardRepository.save(board);

    postImageService.uploadImage(board.getId(), "boarde", images);
  }

  @Transactional(readOnly = true)
  public PageResponse<BoardResponse> getBoards(int page, int size) {
    PageRequest pageRequest = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<Board> boards = boardRepository.findAll(pageRequest);

    Page<BoardResponse> boardResponses = boards.map(board -> {
      // PostImage 레포지토리를 사용하여 해당 게시글의 이미지들 조회
      List<String> imagePaths = postImageRepository.findByPostTypeAndPostId("BOARD", board.getId())
              .stream()
              .map(postImage -> {
                // 파일 경로 안전하게 조합
                String path = Optional.ofNullable(postImage.getImagePath()).orElse("");
                return path;
              })
              .collect(Collectors.toList());

      return new BoardResponse(
              board.getId(),
              board.getTitle(),
              board.getContent(),
              board.getBranch().getRegion(),
              board.getUser().getName(),
              imagePaths,
              board.getCreatedAt(),
              board.getModifiedAt()
      );
    });

    return PageResponse.success(boardResponses, HttpStatus.OK, "게시글 조회 성공");
  }

  @Transactional(readOnly = true)
  public BoardResponse getBoard(Long boardId) {
    Board board = boardRepository.findById(boardId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    // 해당 게시글의 이미지 조회
    List<String> imagePaths = postImageRepository.findByPostTypeAndPostId("BOARD", board.getId())
            .stream()
            .map(postImage -> {
              String path = Optional.ofNullable(postImage.getImagePath()).orElse("");
              return path;
            })
            .toList();

    return BoardResponse.fromEntity(board, imagePaths);
  }



  public Status updateBoard(BoardUpdate request, Long userId, Long boardId, List<MultipartFile> images) {
    userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Board board = boardRepository.findById(boardId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    if (!board.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("게시글 수정 권한이 없습니다.");
    }

    board.updateBoard(request);

    postImageService.updateImages(board.getId(), "board", images);

    return Status.builder().status(HttpStatus.OK.value()).message("게시글 수정 완료").build();
  }

  public void deleteBoard(Long userId, Long boardId) {
    userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Board board = boardRepository.findById(boardId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    board.softDelte();
  }
}
