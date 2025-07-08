package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Order;
import bon.bon_jujitsu.domain.OrderStatus;
import bon.bon_jujitsu.domain.User;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {
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
      "WHERE o.orderStatus = :status " +
      "ORDER BY o.createdAt DESC")
  Page<Order> findAllByOrderStatusWithUserAndItems(@Param("status") OrderStatus status, Pageable pageable);

  @Query("SELECT DISTINCT o FROM Order o " +
      "JOIN FETCH o.user u " +
      "LEFT JOIN FETCH o.orderItems oi " +
      "LEFT JOIN FETCH oi.item i " +
      "WHERE o.user = :user AND o.orderStatus IN :statuses " +
      "ORDER BY o.createdAt DESC")
  Page<Order> findAllByUserAndOrderStatusInWithItems(@Param("user") User user,
      @Param("statuses") List<OrderStatus> statuses,
      Pageable pageable);

  @Query("SELECT DISTINCT o FROM Order o " +
      "JOIN FETCH o.orderItems oi " +
      "WHERE o.user.id = :userId " +
      "AND oi.item.id = :itemId " +
      "AND o.orderStatus = :status " +
      "ORDER BY o.createdAt DESC")
  List<Order> findCompletedOrdersByUserIdAndItemId(Long userId, Long itemId, OrderStatus orderStatus);
}
