package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Item;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, Long> {
  Optional<Item> findById(Long id);
}
