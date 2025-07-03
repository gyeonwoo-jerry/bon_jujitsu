package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.CartItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

  @Query("SELECT ci FROM CartItem ci " +
      "JOIN FETCH ci.item i " +
      "JOIN FETCH ci.itemOption io " +
      "WHERE ci.id IN :ids")
  List<CartItem> findAllByIdWithItemAndOption(@Param("ids") List<Long> ids);
}
