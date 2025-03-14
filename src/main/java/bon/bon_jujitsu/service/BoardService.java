package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Board;
import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.BoardRequest;
import bon.bon_jujitsu.dto.response.BoardResponse;
import bon.bon_jujitsu.dto.update.BoardUpdate;
import bon.bon_jujitsu.repository.BoardRepository;
import bon.bon_jujitsu.repository.BranchRepository;
import bon.bon_jujitsu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {

  private final BoardRepository boardRepository;
  private final BranchRepository branchRepository;
  private final UserRepository userRepository;

  public void createBoard(Long id, BoardRequest request) {
    User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Branch branch = branchRepository.findById(user.getBranch().getId()).orElseThrow(()->
        new IllegalArgumentException("존재하지 않는 체육관입니다."));

    Board board = Board.builder()
        .title(request.title())
        .content(request.content())
        .branch(branch)
        .user(user)
        .build();

    boardRepository.save(board);
  }

  @Transactional(readOnly = true)
  public PageResponse<BoardResponse> getBoards(int page, int size) {
    PageRequest pageRequest = PageRequest.of(page -1, size);

    Page<Board> post = boardRepository.findAll(pageRequest);

    Page<BoardResponse> posts = post.map(board-> new BoardResponse(
        board.getId(),
        board.getTitle(),
        board.getContent(),
        board.getBranch().getRegion(),
        board.getUser().getName(),
        board.getCreatedAt(),
        board.getModifiedAt()
    ));

    return PageResponse.success(posts, HttpStatus.OK, "게시글 조회 성공");
  }

  @Transactional(readOnly = true)
  public BoardResponse getBoard(Long boardId) {
    Board post = boardRepository.findById(boardId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    BoardResponse boardResponse = BoardResponse.fromEntity(post);
    return boardResponse;
  }


  public Status updateBoard(BoardUpdate request, Long id, Long boardId) {
    userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Board board = boardRepository.findById(boardId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    board.updateBoard(request);

    return Status.builder().status(HttpStatus.OK.value()).message("게시글 수정 완료").build();
  }

  public void deleteBoard(Long id, Long boardId) {
    userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    Board board = boardRepository.findById(boardId).orElseThrow(()-> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

    board.softDelte();
  }
}
