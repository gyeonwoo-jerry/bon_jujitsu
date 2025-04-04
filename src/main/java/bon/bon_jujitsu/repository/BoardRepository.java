package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Board;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardRepository extends JpaRepository<Board, Integer> {

  Optional<Board> findById(Long boardId);

  Page<Board> findByUser_NameContainingIgnoreCase(String name, PageRequest pageRequest);
}
