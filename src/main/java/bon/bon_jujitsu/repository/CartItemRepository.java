package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

}
