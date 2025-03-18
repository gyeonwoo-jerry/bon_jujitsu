package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

}
