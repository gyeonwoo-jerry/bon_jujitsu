package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.OrderAction;
import bon.bon_jujitsu.domain.OrderActionType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderActionRepository extends JpaRepository<OrderAction, Long> {
  Optional<OrderAction> findFirstByOrderIdAndActionTypeOrderByCreatedAtDesc(Long orderId, OrderActionType actionType);
}
