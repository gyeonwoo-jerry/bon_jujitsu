package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Cart;
import bon.bon_jujitsu.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CartRepository extends JpaRepository<Cart, Long> {

  @Query("SELECT c FROM Cart c LEFT JOIN FETCH c.cartItems WHERE c.user = :user")
  Optional<Cart> findByUser(User user);

  // N+1 문제 해결을 위한 Fetch Join
  @Query("SELECT c FROM Cart c " +
      "LEFT JOIN FETCH c.cartItems ci " +
      "LEFT JOIN FETCH ci.item " +
      "LEFT JOIN FETCH ci.itemOption " +
      "WHERE c.user = :user")
  Optional<Cart> findByUserWithItems(@Param("user") User user);
}
