package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.News;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsRepository extends JpaRepository<News, Long> {

  Optional<News> findById(Long newsId);
}
