package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Cart;
import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.User;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CartRepository extends JpaRepository<Cart, Long> {

  Page<Cart> findAllByUserId(Long id, PageRequest pageRequest);

  void deleteAllByUser(User user);

  @Query("SELECT c FROM Cart c LEFT JOIN FETCH c.cartItems WHERE c.user = :user")
  Optional<Cart> findByUser(User user);
}
