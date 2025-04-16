package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Review;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository <Review, Long>{

  Page<Review> findAllByUserIdAndDepth(Long userId, int depth, PageRequest pageRequest);

  List<Review> findAllByParentReviewIdIn(List<Long> parentReviewIds);

  Page<Review> findAllByItem_IdAndDepthEqualsOrderByCreatedAtDesc(Long itemId, int depth, Pageable pageable);

  List<Review> findAllByItem_IdAndParentReview_IdInOrderByCreatedAtAsc(Long itemId, List<Long> rootIds);

  @Query("SELECT r FROM Review r WHERE r.item.id = :itemId AND r.parentReview IS NULL ORDER BY r.createdAt DESC")
  Page<Review> findRootReviewsByItemId(@Param("itemId") Long itemId, Pageable pageable);

  @Query("SELECT r FROM Review r WHERE r.parentReview.id IN :parentIds ORDER BY r.createdAt ASC")
  List<Review> findAllChildReviewsByParentIds(@Param("parentIds") List<Long> parentIds);
}

