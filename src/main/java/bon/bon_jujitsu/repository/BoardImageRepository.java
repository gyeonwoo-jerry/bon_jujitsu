package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.BoardImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardImageRepository extends JpaRepository<BoardImage, Long> {

  List<BoardImage> findByBoardId(Long id);
}
