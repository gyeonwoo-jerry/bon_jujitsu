package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.Order;
import bon.bon_jujitsu.domain.OrderStatus;
import bon.bon_jujitsu.domain.User;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
  Page<Order> findAllByUserId(Long id, PageRequest pageRequest);

  Page<Order> findAllByOrderStatusOrderByCreatedAtDesc(OrderStatus orderStatus, PageRequest pageRequest);

  Optional<Order> findById(Long id);

  List<Order> findAllByUser(User user);
}
