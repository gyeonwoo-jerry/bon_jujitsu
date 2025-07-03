package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Item;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ItemRepository extends JpaRepository<Item, Long> {

  boolean existsByName(String name);

  @Query("SELECT DISTINCT i FROM Item i " +
      "LEFT JOIN FETCH i.itemOptions " +
      "WHERE LOWER(i.name) LIKE LOWER(CONCAT('%', :name, '%'))")
  Page<Item> findByNameContainingIgnoreCaseWithFetch(@Param("name") String name, PageRequest pageRequest);

  @Query("SELECT DISTINCT i FROM Item i " +
      "LEFT JOIN FETCH i.itemOptions")
  Page<Item> findAllWithFetch(PageRequest pageRequest);

  @Query("SELECT DISTINCT i FROM Item i " +
      "LEFT JOIN FETCH i.itemOptions " +
      "WHERE i.id = :itemId")
  Optional<Item> findByIdWithFetch(@Param("itemId") Long itemId);

  @Query("SELECT DISTINCT i FROM Item i " +
      "LEFT JOIN FETCH i.itemOptions " +
      "ORDER BY i.createdAt DESC")
  Page<Item> findTop4ByOrderByCreatedAtDescWithFetch(PageRequest pageRequest);
}


