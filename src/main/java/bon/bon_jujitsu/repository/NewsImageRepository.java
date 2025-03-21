package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.NewsImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsImageRepository extends JpaRepository<NewsImage, Long> {

  List<NewsImage> findByNewsId(Long id);
}
