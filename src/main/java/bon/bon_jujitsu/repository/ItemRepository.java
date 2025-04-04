package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemRepository extends JpaRepository<Item, Long> {

    Page<Item> findTop4ByOrderByCreatedAtDesc(PageRequest pageRequest);

  boolean existsByName(String name);

  Page<Item> findByNameContainingIgnoreCase(String name, PageRequest pageRequest);
}
