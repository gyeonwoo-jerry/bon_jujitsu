package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Board;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BoardRepository extends JpaRepository<Board, Integer>,
    JpaSpecificationExecutor<Board> {

  Optional<Board> findById(Long boardId);
}
