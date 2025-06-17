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

  @Query("SELECT r FROM Review r " +
      "JOIN FETCH r.user " + // ManyToOne은 fetch join 가능
      "LEFT JOIN r.order o " + // order는 ManyToOne이라 lazy 유지 가능
      "WHERE r.item.id = :itemId AND r.isDeleted = false")
  Page<Review> findAllByItem_Id(@Param("itemId") Long itemId, Pageable pageable);

  @Query("SELECT COUNT(r) > 0 FROM Review r " +
      "WHERE r.order.id = :orderId " +
      "AND r.item.id = :itemId " +
      "AND r.user.id = :userId " +
      "AND r.isDeleted = false")
  boolean existsByOrderIdAndItemIdAndUserId(
      @Param("orderId") Long orderId,
      @Param("itemId") Long itemId,
      @Param("userId") Long userId
  );
}

