package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Cart;
import bon.bon_jujitsu.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CartRepository extends JpaRepository<Cart, Long> {

  @Query("SELECT c FROM Cart c LEFT JOIN FETCH c.cartItems WHERE c.user = :user")
  Optional<Cart> findByUser(User user);
}
