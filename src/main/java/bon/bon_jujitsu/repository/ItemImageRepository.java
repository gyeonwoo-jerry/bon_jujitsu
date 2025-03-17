package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.ItemImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemImageRepository extends JpaRepository<ItemImage, Long> {

  List<ItemImage> findByItemId(Long id);
}
