package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.ReviewImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewImageRepository extends JpaRepository<ReviewImage, Long> {

  List<ReviewImage> findByReviewId(Long id);
}
