package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Review;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository <Review, Long>{

  Page<Review> findAllByItemOrderByCreatedAtDesc(Long itemId, PageRequest pageRequest);

  Page<Review> findAllByUserIdAndDepth(Long userId, int depth, PageRequest pageRequest);

  List<Review> findAllByParentReviewIdIn(List<Long> parentReviewIds);
}
