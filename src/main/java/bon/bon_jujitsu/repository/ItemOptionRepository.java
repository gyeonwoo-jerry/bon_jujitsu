package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.ItemOption;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemOptionRepository extends JpaRepository<ItemOption, Long> {

  void deleteAllByItemId(Long itemId);

  List<ItemOption> findByItemId(Long itemId);
}
