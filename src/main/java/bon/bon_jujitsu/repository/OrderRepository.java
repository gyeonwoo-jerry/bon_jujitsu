package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.Order;
import bon.bon_jujitsu.domain.OrderStatus;
import bon.bon_jujitsu.domain.User;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {
  Optional<Order> findTopByUserIdAndOrderItems_Item_IdOrderByCreatedAtDesc(Long userId, Long itemId);

  @Query("SELECT DISTINCT o FROM Order o " +
      "JOIN FETCH o.orderItems oi " +
      "JOIN FETCH oi.item " +
      "WHERE o.user.id = :userId " +
      "AND o.orderStatus = :status " +
      "AND o.createdAt >= :fromDate " +
      "ORDER BY o.createdAt DESC")
  List<Order> findRecentCompletedOrdersByUserId(
      @Param("userId") Long userId,
      @Param("status") OrderStatus status,
      @Param("fromDate") LocalDateTime fromDate
  );

  @Query("SELECT DISTINCT o FROM Order o " +
      "JOIN FETCH o.user u " +
      "LEFT JOIN FETCH o.orderItems oi " +
      "LEFT JOIN FETCH oi.item i " +
      "LEFT JOIN FETCH oi.itemOption io " +
      "WHERE o.orderStatus = :status " +
      "ORDER BY o.createdAt DESC")
  Page<Order> findAllByOrderStatusWithUserAndItems(@Param("status") OrderStatus status, Pageable pageable);

  @Query("SELECT DISTINCT o FROM Order o " +
      "JOIN FETCH o.user u " +
      "LEFT JOIN FETCH o.orderItems oi " +
      "LEFT JOIN FETCH oi.item i " +
      "LEFT JOIN FETCH oi.itemOption io " +
      "WHERE o.user = :user AND o.orderStatus IN :statuses " +
      "ORDER BY o.createdAt DESC")
  Page<Order> findAllByUserAndOrderStatusInWithItems(@Param("user") User user,
      @Param("statuses") List<OrderStatus> statuses,
      Pageable pageable);
}
